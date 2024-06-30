const nlp = require("compromise");

/**
 * Extract key information from a document content
 * @param {string} content - The content of the document
 * @param {number} maxLength - The maximum length of the extracted content
 * @returns {string} - The extracted key information
 */
function extractKeyInfo(content, maxLength) {
  // Split the content into sentences using NLP
  const doc = nlp(content);
  const sentences = doc.sentences().out("array");

  // Define keywords to rank sentences by importance
  const keywords = [
    "personal",
    "career",
    "experience",
    "project",
    "achievement",
    "education",
    "certification",
  ];

  // Rank sentences based on the presence of keywords
  const rankedSentences = sentences.sort((a, b) => {
    const aScore = keywords.reduce(
      (score, keyword) =>
        a.toLowerCase().includes(keyword) ? score + 1 : score,
      0
    );
    const bScore = keywords.reduce(
      (score, keyword) =>
        b.toLowerCase().includes(keyword) ? score + 1 : score,
      0
    );
    return bScore - aScore;
  });

  // Combine the top-ranked sentences into a single string
  let extractedContent = "";
  for (const sentence of rankedSentences) {
    if (extractedContent.length + sentence.length <= maxLength) {
      extractedContent += `${sentence} `;
    } else {
      break;
    }
  }

  return extractedContent.trim();
}

module.exports = extractKeyInfo;
