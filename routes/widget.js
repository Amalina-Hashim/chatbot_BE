const express = require("express");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const { verifyToken } = require("../utils/auth");

const router = express.Router();

router.post("/", verifyToken, async (req, res) => {
  const userId = req.userId;
  const distDir = path.join(__dirname, "../dist");

  // Ensure the dist directory exists
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
  }

  try {
    const output = fs.createWriteStream(
      path.join(distDir, "chatbot-widget.zip")
    );
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    output.on("close", () => {
      console.log(archive.pointer() + " total bytes");
      console.log(
        "Archiver has been finalized and the output file descriptor has closed."
      );
      res.download(path.join(distDir, "chatbot-widget.zip"));
    });

    archive.on("error", (err) => {
      throw err;
    });

    archive.pipe(output);

    archive.file(
      path.join(__dirname, "../src/components/ChatBotWidget/ChatBotWidget.js"),
      { name: "chatbot-widget.js" }
    );

    const widgetCode = `
    <script src="path/to/chatbot-widget.js"></script>
    <div id="chatbot-container"></div>
    <script>
      ChatBotWidget.renderChatBotWidget('chatbot-container');
    </script>
    `;

    fs.writeFileSync(path.join(distDir, "widget-code.html"), widgetCode);

    archive.file(path.join(distDir, "widget-code.html"), {
      name: "widget-code.html",
    });

    archive.finalize();
  } catch (error) {
    console.error("Error generating widget:", error);
    res.status(500).send("Error generating widget");
  }
});

module.exports = router;
