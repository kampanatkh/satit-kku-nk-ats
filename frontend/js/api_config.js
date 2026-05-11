// api_config.js
// กำหนดค่า URL ของ Google Apps Script Web App
// แก้ไขค่า GAS_URL ให้ตรงกับ Web App URL ที่ได้จากการ Deploy

const GAS_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';
// วิธีหา URL:
// 1. เปิด Google Apps Script (script.google.com)
// 2. เลือกไฟล์ Code.gs ที่สร้างไว้
// 3. กด Deploy > New deployment
// 4. เลือก Type: Web app
// 5. ตั้งค่า Execute as: Me, Who has access: Anyone
// 6. กด Deploy แล้วคัดลอก URL มาใส่ที่นี่
