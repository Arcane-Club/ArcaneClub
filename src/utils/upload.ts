import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure directories exist
const uploadDir = path.join(process.cwd(), 'public/uploads');
const pagesDir = path.join(process.cwd(), 'public/pages');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(pagesDir)) {
  fs.mkdirSync(pagesDir, { recursive: true });
}

// Storage for images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'htmlFile') {
       // For HTML files, we might want a specific logic, but let's put them in a temp or direct folder
       // Actually, we'll handle the moving in the controller or use a different storage config
       cb(null, pagesDir);
    } else {
       cb(null, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});
