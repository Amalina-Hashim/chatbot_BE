
    # Chatbot Widget Integration

    ## How to Integrate

    1. Copy the `ChatBotWidget.js` and `ChatBot.js` files to a suitable location in your React project (e.g., `src/components`).
    2. Install dependencies: `npm install axios tailwindcss `
    3. Add the following HTML to your `public/index.html` or any HTML file that is rendered as part of your React application:
    4. Remember to also add into index.js: import { renderChatBotWidget } from "./components/ChatBotWidget";
      window.renderChatBotWidget = renderChatBotWidget;

    ```html
    <div id="chatbot-button" style="position:fixed; bottom:20px; right:20px; cursor:pointer; background-color:#5a00ff; color:white; padding:10px; border-radius:50%; z-index:1000;">
      Chat
    </div>
    <div id="chatbot-container" style="position:fixed; bottom:70px; right:20px; z-index:1000;"></div>
    <script src="%PUBLIC_URL%/components/ChatBotWidget.js"></script>
    <script>
      const userToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IlNhbGx5IiwiaWF0IjoxNzE5ODk0MzUzLCJleHAiOjE3MTk5Mzc1NTN9.hGdwtD56k5o4VmFib3HmT7xp_gsOf0sKs1aDma9aCgs"; // user token auto generated
      document.getElementById("chatbot-button").onclick = function () {
        if (!document.getElementById("chatbot-widget")) {
          window.renderChatBotWidget("chatbot-container", userToken);
        }
      };
    </script>
    ```

    5. Make sure to replace `%PUBLIC_URL%` with the correct path to where you placed the `ChatBotWidget.js` file.

    ## Example

    Here is an example integration:

    ```html
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
          const userToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IlNhbGx5IiwiaWF0IjoxNzE5ODk0MzUzLCJleHAiOjE3MTk5Mzc1NTN9.hGdwtD56k5o4VmFib3HmT7xp_gsOf0sKs1aDma9aCgs"; // user token auto generated
          document.getElementById("chatbot-button").onclick = function () {
            if (!document.getElementById("chatbot-widget")) {
              window.renderChatBotWidget("chatbot-container", userToken);
            }
          };
        </script>
      </body>
    </html>
    ```

    6. Note that CORS enablement required on Azure if you are implementing widget on your website
    