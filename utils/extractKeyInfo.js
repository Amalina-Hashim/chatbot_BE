/**
 * Extract key information from a document content
 * @param {string} content - The content of the document
 * @param {number} maxLength - The maximum length of the extracted content
 * @returns {string} - The extracted key information
 */
function extractKeyInfo(content, maxLength) {
  if (content.length <= maxLength) {
    return content;
  }
  return content.slice(0, maxLength);
}

module.exports = extractKeyInfo;
