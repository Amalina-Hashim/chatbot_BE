const multer = require("multer");

const generalFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const generalFileFilter = (req, file, cb) => {
  const allowedTypes = [
    "text/plain",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only text, PDF, and Word documents are allowed."
      ),
      false
    );
  }
};

const generalFileUpload = multer({
  storage: generalFileStorage,
  fileFilter: generalFileFilter,
});

module.exports = generalFileUpload;
