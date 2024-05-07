
import AWS from "aws-sdk";
import path from "path";

const endpoint = new AWS.Endpoint("https://vpc-vpc-test-es-ogabzxlx36obk66fxftvjrteca.us-west-2.es.amazonaws.com");
const httpClient = new AWS.NodeHttpClient();
const credentials = new AWS.EnvironmentCredentials("AWS");
const esDomain = {
  index: "sampleIndex",
  doctype: "_doc",
};

/**
 * Sends a request to Elasticsearch
 *
 * @param {string} httpMethod - The HTTP method, e.g. 'GET', 'PUT', 'DELETE', etc
 * @param {string} requestPath - The HTTP path (relative to the Elasticsearch domain), e.g. '.kibana'
 * @param {Object} [payload] - An optional JavaScript object that will be serialized to the HTTP request body
 * @param {Boolean} eof - True if the search is for firehose index. False for elastic domain.
 * @returns {Promise} Promise - object with the result of the HTTP response
 */
export function sendRequest({
  payload,
  eof,
  isGlobal,
}) {
  const request = new AWS.HttpRequest(endpoint);
  request.method = "POST";
  
  request.path = path.join(request.path, "");
  request.region = "us-west-2";
  request.body = JSON.stringify(payload);
  request.headers["presigned-expires"] = false;
  request.headers["Content-Type"] = "application/json";
  request.headers.Host = endpoint.host;

  const signer = new AWS.Signers.V4(request, "es");
  signer.addAuthorization(credentials, new Date());

  return new Promise((resolve, reject) => {
    httpClient.handleRequest(
      request,
      null,
      (response) => {
        const { statusCode, statusMessage, headers } = response;
        let body = "";
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          const data = {
            statusCode,
            statusMessage,
            headers,
          };
          console.log('body==>',body)
          if (body ) {
            data.body = "POST" !== "GET" ? JSON.parse(body) : body;
          }
          resolve(data);
        });
      },
      (err) => {
        reject(err);
      }
    );
  });
}

