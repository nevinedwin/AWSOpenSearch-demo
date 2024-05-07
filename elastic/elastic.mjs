import AWS from 'aws-sdk'
import path from "path"

const { ES_ENDPOINT } = process.env;

const endpoint = new AWS.Endpoint(ES_ENDPOINT);
const httpsClient = new AWS.NodeHttpClient();
const credentials = new AWS.EnvironmentCredentials("AWS");

const esDomain = {
    index: "sampleindex",
    doctype: "_doc"
};


export function main(event) {

    console.log(`event: ${JSON.stringify(event)}`);

    const {
        httpMethod,
        requestPath,
        payload,
        isGlobal
    } = JSON.parse(event.body);

    const request = new AWS.HttpRequest(endpoint);

    request.method = httpMethod;
    request.path = !isGlobal ? path.join("/", esDomain.index, esDomain.doctype) : "";
    console.log(`PAth: ${JSON.stringify(request.path)}, ${requestPath}`);
    request.path += requestPath;
    console.log(`Paath: ${JSON.stringify(request.path)}`);
    request.region = "us-west-2";
    request.body = JSON.stringify(payload);
    request.headers["presigned-expires"] = false;
    request.headers["Content-Type"] = "application/json";
    request.headers.Host = endpoint.host;

    console.log(`request: ${JSON.stringify(request)}`);

    const signer = new AWS.Signers.V4(request, "es");

    signer.addAuthorization(credentials, new Date());

    console.log(`signer: ${JSON.stringify(signer)}`);

    return new Promise((resolve, reject) => {
        httpsClient.handleRequest(
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
                        headers
                    };
                    /** debug */
                    console.log('body===>', body);
                    /** debug */

                    if (body)
                        data.body = httpMethod !== "GET" ? JSON.parse(body) : body;

                    resolve(data);
                })
            },
            (err) => reject({err})
        );
    })
};

