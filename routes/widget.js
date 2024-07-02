const express = require("express");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const { verifyToken } = require("../utils/auth");

const router = express.Router();

router.post("/", verifyToken, async (req, res) => {
  const userId = req.userId;
  const userToken = req.headers.authorization.split(" ")[1];
  const distDir = path.join(__dirname, "../dist");
  const resourcesDir = path.join(__dirname, "../resources");

  // Ensure the dist directory exists
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
  }

  try {
    const outputFilePath = path.join(distDir, "chatbot-widget.zip");
    const output = fs.createWriteStream(outputFilePath);
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    output.on("close", () => {
      console.log(`Archive created with ${archive.pointer()} total bytes`);
      console.log(`Archive file path: ${outputFilePath}`);
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=chatbot-widget.zip"
      );
      res.download(outputFilePath, "chatbot-widget.zip", (err) => {
        if (err) {
          console.error("Error sending file:", err);
          res.status(500).send("Error downloading the file");
        }
      });
    });

    archive.on("error", (err) => {
      throw err;
    });

    archive.pipe(output);

    // Add files to the archive
    const filesToInclude = ["ChatBotWidget.js", "ChatBot.js"];
    filesToInclude.forEach((file) => {
      const filePath = path.join(resourcesDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`Adding ${file} to archive`);
        archive.file(filePath, { name: file });
      } else {
        console.error(`${file} does not exist at ${filePath}`);
      }
    });

    // Add additional documentation and example integration
    const widgetCode = `
    <script src="./ChatBotWidget.js"></script>
    <div id="chatbot-button" style="position:fixed; bottom:20px; right:20px; cursor:pointer; background-color:#5a00ff; color:white; padding:10px; border-radius:50%; z-index:1000;">
      Chat
    </div>
    <div id="chatbot-container" style="position:fixed; bottom:70px; right:20px; z-index:1000;"></div>
    <script>
      const userToken = "${userToken}"; // auto generate user token
      document.getElementById("chatbot-button").onclick = function () {
        if (!document.getElementById("chatbot-widget")) {
          window.renderChatBotWidget("chatbot-container", userToken);
        }
      };
    </script>
    `;

    const readmeContent = `
    # Chatbot Widget Integration

    ## How to Integrate

    1. Copy the \`ChatBotWidget.js\` and \`ChatBot.js\` files to a suitable location in your React project (e.g., \`src/components\`).
    2. Install dependencies: \`npm install axios tailwindcss \`
    3. Add the following HTML to your \`public/index.html\` or any HTML file that is rendered as part of your React application:
    4. Remember to also add into index.js: import { renderChatBotWidget } from "./components/ChatBotWidget";
      window.renderChatBotWidget = renderChatBotWidget;

    \`\`\`html
    <div id="chatbot-button" style="position:fixed; bottom:20px; right:20px; cursor:pointer; background-color:#5a00ff; color:white; padding:10px; border-radius:50%; z-index:1000;">
      Chat
    </div>
    <div id="chatbot-container" style="position:fixed; bottom:70px; right:20px; z-index:1000;"></div>
    <script src="%PUBLIC_URL%/components/ChatBotWidget.js"></script>
    <script>
      const userToken = "${userToken}"; // user token auto generated
      document.getElementById("chatbot-button").onclick = function () {
        if (!document.getElementById("chatbot-widget")) {
          window.renderChatBotWidget("chatbot-container", userToken);
        }
      };
    </script>
    \`\`\`

    5. Make sure to replace \`%PUBLIC_URL%\` with the correct path to where you placed the \`ChatBotWidget.js\` file.

    ## Example

    Here is an example integration:

    \`\`\`html
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>React App</title>
      </head>
      <body>
        <div id="root"></div>
        <!-- Chatbot widget integration -->
        <div id="chatbot-button" style="position:fixed; bottom:20px; right:20px; cursor:pointer; background-color:#5a00ff; color:white; padding:10px; border-radius:50%; z-index:1000;">
          Chat
        </div>
        <div id="chatbot-container" style="position:fixed; bottom:70px; right:20px; z-index:1000;"></div>
        <script src="%PUBLIC_URL%/components/ChatBotWidget.js"></script>
        <script>
          const userToken = "${userToken}"; // user token auto generated
          document.getElementById("chatbot-button").onclick = function () {
            if (!document.getElementById("chatbot-widget")) {
              window.renderChatBotWidget("chatbot-container", userToken);
            }
          };
        </script>
      </body>
    </html>
    \`\`\`

    6. Note that CORS enablement required on Azure if you are implementing widget on your website
    `;

    const widgetCodePath = path.join(resourcesDir, "widget-code.html");
    const readmePath = path.join(resourcesDir, "README.md");

    fs.writeFileSync(widgetCodePath, widgetCode);
    fs.writeFileSync(readmePath, readmeContent);

    archive.file(widgetCodePath, { name: "widget-code.html" });
    archive.file(readmePath, { name: "README.md" });

    archive.finalize();
  } catch (error) {
    console.error("Error generating widget:", error);
    res.status(500).send("Error generating widget");
  }
});

module.exports = router;
