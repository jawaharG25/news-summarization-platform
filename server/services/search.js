const { SearchClient, SearchIndexClient, AzureKeyCredential } = require("@azure/search-documents");

const SEARCH_ENDPOINT = process.env.AZURE_SEARCH_ENDPOINT || "https://newslens-search.search.windows.net";
const SEARCH_KEY = process.env.AZURE_SEARCH_KEY;
const INDEX_NAME = "articles-index";

let searchClient = null;
let indexClient = null;

// Initialize clients if key is available
if (SEARCH_KEY) {
  const credential = new AzureKeyCredential(SEARCH_KEY);
  searchClient = new SearchClient(SEARCH_ENDPOINT, INDEX_NAME, credential);
  indexClient = new SearchIndexClient(SEARCH_ENDPOINT, credential);
}

/**
 * Create the search index if it doesn't exist
 */
async function createIndexIfNotExists() {
  if (!indexClient) {
    console.warn("Azure Search not configured. Skipping index creation.");
    return;
  }

  try {
    // Check if index exists
    await indexClient.getIndex(INDEX_NAME);
    console.log(`Search index '${INDEX_NAME}' already exists.`);
  } catch (error) {
    if (error.statusCode === 404) {
      // Index doesn't exist, create it
      console.log(`Creating search index '${INDEX_NAME}'...`);
      
      const indexDefinition = {
        name: INDEX_NAME,
        fields: [
          {
            name: "id",
            type: "Edm.String",
            key: true,
            searchable: false,
            filterable: true,
            sortable: false
          },
          {
            name: "title",
            type: "Edm.String",
            searchable: true,
            filterable: false,
            sortable: false,
            analyzer: "en.microsoft"
          },
          {
            name: "url",
            type: "Edm.String",
            searchable: false,
            filterable: false,
            sortable: false
          },
          {
            name: "summary",
            type: "Edm.String",
            searchable: true,
            filterable: false,
            sortable: false,
            analyzer: "en.microsoft"
          },
          {
            name: "biasScore",
            type: "Edm.Int32",
            searchable: false,
            filterable: true,
            sortable: true
          },
          {
            name: "sentiment",
            type: "Edm.Int32",
            searchable: false,
            filterable: true,
            sortable: true
          },
          {
            name: "timestamp",
            type: "Edm.DateTimeOffset",
            searchable: false,
            filterable: true,
            sortable: true
          }
        ],
        suggesters: [
          {
            name: "sg",
            searchMode: "analyzingInfixMatching",
            sourceFields: ["title"]
          }
        ],
        corsOptions: {
          allowedOrigins: ["*"]
        }
      };

      await indexClient.createIndex(indexDefinition);
      console.log(`Search index '${INDEX_NAME}' created successfully.`);
    } else {
      console.error("Error checking/creating index:", error.message);
    }
  }
}

/**
 * Index an article in Azure AI Search
 * @param {Object} article - Article object from MongoDB
 */
async function indexArticle(article) {
  if (!searchClient) {
    console.warn("Azure Search not configured. Skipping indexing.");
    return;
  }

  try {
    const searchDocument = {
      id: article._id.toString(),
      title: article.title,
      url: article.url,
      summary: Array.isArray(article.summary) ? article.summary.join(' ') : article.summary,
      biasScore: article.biasScore,
      sentiment: article.sentiment,
      timestamp: article.timestamp || new Date()
    };

    await searchClient.uploadDocuments([searchDocument]);
    console.log(`Article indexed: ${article.title}`);
  } catch (error) {
    console.error("Error indexing article:", error.message);
    // Don't throw - indexing failure shouldn't break the scan
  }
}

/**
 * Search articles in Azure AI Search
 * @param {string} query - Search query
 * @param {Object} options - Search options (filters, top, etc.)
 */
async function searchArticles(query, options = {}) {
  if (!searchClient) {
    console.warn("Azure Search not configured. Returning empty results.");
    return [];
  }

  try {
    const searchOptions = {
      top: options.top || 10,
      skip: options.skip || 0,
      includeTotalCount: true,
      filter: options.filter,
      orderBy: options.orderBy,
      select: ["id", "title", "url", "summary", "biasScore", "sentiment", "timestamp"]
    };

    const searchResults = await searchClient.search(query, searchOptions);
    const results = [];
    
    for await (const result of searchResults.results) {
      results.push(result.document);
    }

    return results;
  } catch (error) {
    console.error("Error searching articles:", error.message);
    return [];
  }
}

/**
 * Delete an article from the search index
 * @param {string} articleId - MongoDB article ID
 */
async function deleteArticle(articleId) {
  if (!searchClient) {
    console.warn("Azure Search not configured. Skipping deletion.");
    return;
  }

  try {
    await searchClient.deleteDocuments([{ id: articleId }]);
    console.log(`Article deleted from index: ${articleId}`);
  } catch (error) {
    console.error("Error deleting article from index:", error.message);
  }
}

module.exports = {
  createIndexIfNotExists,
  indexArticle,
  searchArticles,
  deleteArticle
};
