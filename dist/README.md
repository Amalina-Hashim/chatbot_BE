
    # Chatbot Widget Integration

    ## How to Integrate

    1. Copy the `chatbot-widget.js` file to a suitable location in your React project (e.g., `src/components`).
    2. Add the following HTML to your `public/index.html` or any HTML file that is rendered as part of your React application:

    ```html
    <div id="chatbot-button" style="position:fixed; bottom:20px; right:20px; cursor:pointer; background-color:#5a00ff; color:white; padding:10px; border-radius:50%; z-index:1000;">
      Chat
    </div>
    <div id="chatbot-container" style="position:fixed; bottom:70px; right:20px; z-index:1000;"></div>
    <script src="%PUBLIC_URL%/components/chatbot-widget.js"></script>
    <script>
      document.getElementById("chatbot-button").onclick = function() {
        if (!document.getElementById("chatbot-widget")) {
          renderChatBotWidget('chatbot-container');
        }
      }
    </script>
    ```

    3. Make sure to replace `%PUBLIC_URL%` with the correct path to where you placed the `chatbot-widget.js` file.

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
        <script src="%PUBLIC_URL%/components/chatbot-widget.js"></script>
        <script>
          document.getElementById("chatbot-button").onclick = function() {
            if (!document.getElementById("chatbot-widget")) {
              renderChatBotWidget('chatbot-container');
            }
          }
        </script>
      </body>
    </html>
    ```
    