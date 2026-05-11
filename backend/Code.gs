// ============================================================
// Code.gs - Google Apps Script Backend API
// ระบบติดตามการสมัครสอบบุคลากร
// โรงเรียนสาธิตมหาวิทยาลัยขอนแก่น วิทยาเขตหนองคาย
// ============================================================

// ===== CONFIG =====
var SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
var SHEET_APPLICANTS = 'Applicants';
var SHEET_ADMIN_USERS = 'AdminUsers';
var SHEET_SETTINGS = 'Settings';
var DRIVE_FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID_HERE';

// ===== doGet =====
function doGet(e) {
  var params = e.parameter;
  var action = params.action || '';
  if (action === 'getApplicants') return getApplicants(params);
  if (action === 'getSettings') return getSettings();
  return jsonResponse({ status: 'ok', message: 'ATS API is running' });
}

// ===== doPost =====
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || 'register';
    if (action === 'register') return registerApplicant(payload);
    if (action === 'adminLogin') return adminLogin(payload);
    if (action === 'updateStatus') return updateApplicantStatus(payload);
    return jsonResponse({ status: 'error', message: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

// ===== Register Applicant =====
function registerApplicant(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_APPLICANTS);
  var settings = getSettingsObj();
  var now = new Date();
  var open = new Date(settings.open_date);
  var close = new Date(settings.close_date);
  if (now < open || now > close) {
    return jsonResponse({ status: 'error', message: 'ไม่อยู่ในช่วงเวลารับสมัคร' });
  }
  var fileUrl = '';
  if (data.fileBase64 && data.fileName) {
    fileUrl = saveFileToDrive(data.fileBase64, data.fileName, data.fileType || 'application/octet-stream');
  }
  var lastRow = sheet.getLastRow();
  var appId = 'APP' + String(lastRow).padStart(4, '0');
  var timestamp = new Date().toISOString();
  sheet.appendRow([
    appId, timestamp,
    data.prefix || '', data.firstName || '', data.lastName || '',
    data.phone || '', data.email || '', data.idCard || '',
    data.education || '', data.experience || '',
    data.achievements || '', data.innovations || '',
    data.subject || '', fileUrl, 'รอดำเนินการ'
  ]);
  return jsonResponse({ status: 'success', appId: appId, message: 'ลงทะเบียนสำเร็จ' });
}

// ===== Admin Login =====
function adminLogin(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_ADMIN_USERS);
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.username && rows[i][1] === data.password) {
      return jsonResponse({ status: 'success', role: rows[i][2], username: rows[i][0] });
    }
  }
  return jsonResponse({ status: 'error', message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
}

// ===== Get Applicants =====
function getApplicants(params) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_APPLICANTS);
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var data = [];
  for (var i = 1; i < rows.length; i++) {
    var obj = {};
    headers.forEach(function(h, idx) { obj[h] = rows[i][idx]; });
    if (params.subject && obj['subject'] !== params.subject) continue;
    data.push(obj);
  }
  return jsonResponse({ status: 'success', data: data, total: data.length });
}

// ===== Update Applicant Status =====
function updateApplicantStatus(payload) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_APPLICANTS);
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === payload.appId) {
      sheet.getRange(i + 1, 15).setValue(payload.status);
      if (payload.examRoom) sheet.getRange(i + 1, 16).setValue(payload.examRoom);
      return jsonResponse({ status: 'success', message: 'อัปเดตสถานะสำเร็จ' });
    }
  }
  return jsonResponse({ status: 'error', message: 'ไม่พบผู้สมัคร' });
}

// ===== Get Settings =====
function getSettings() {
  return jsonResponse({ status: 'success', data: getSettingsObj() });
}

function getSettingsObj() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_SETTINGS);
  var rows = sheet.getDataRange().getValues();
  var obj = {};
  for (var i = 1; i < rows.length; i++) {
    obj[rows[i][0]] = rows[i][1];
  }
  return obj;
}

// ===== Save File to Google Drive =====
function saveFileToDrive(base64, fileName, mimeType) {
  try {
    var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    var decoded = Utilities.base64Decode(base64.split(',').pop());
    var blob = Utilities.newBlob(decoded, mimeType, fileName);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    Logger.log('saveFileToDrive error: ' + err);
    return '';
  }
}

// ===== Helper: JSON Response =====
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
