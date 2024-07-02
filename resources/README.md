
    # Chatbot Widget Integration

    ## How to Integrate

    1. Copy the `ChatBotWidget.js` and `ChatBot.js` files to a suitable location in your React project (e.g., `src/components`).
    2. npm install axios
    3. Add the following HTML to your `public/index.html` or any HTML file that is rendered as part of your React application:

    ```html
    <div id="chatbot-button" style="position:fixed; bottom:20px; right:20px; cursor:pointer; background-color:#5a00ff; color:white; padding:10px; border-radius:50%; z-index:1000;">
      Chat
    </div>
    <div id="chatbot-container" style="position:fixed; bottom:70px; right:20px; z-index:1000;"></div>
    <script src="%PUBLIC_URL%/components/ChatBotWidget.js"></script>
    <script>
      const userToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IlVmbyIsImlhdCI6MTcxOTc2MzAzNywiZXhwIjoxNzE5ODA2MjM3fQ.QoHuC-4W1MSEF900Hz5XudC6RyYoSQM4qmW0ERBpoAo"; // auto generated user token
      document.getElementById("chatbot-button").onclick = function() {
        if (!document.getElementById("chatbot-widget")) {
          renderChatBotWidget('chatbot-container', userToken);
        }
      }
    </script>
    ```

    3. Make sure to replace `%PUBLIC_URL%` with the correct path to where you placed the `ChatBotWidget.js` file.

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
          const userToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IlVmbyIsImlhdCI6MTcxOTc2MzAzNywiZXhwIjoxNzE5ODA2MjM3fQ.QoHuC-4W1MSEF900Hz5XudC6RyYoSQM4qmW0ERBpoAo"; // auto generated user token
          document.getElementById("chatbot-button").onclick = function() {
            if (!document.getElementById("chatbot-widget")) {
              renderChatBotWidget('chatbot-container', userToken);
            }
          }
        </script>
      </body>
    </html>
    ```
    