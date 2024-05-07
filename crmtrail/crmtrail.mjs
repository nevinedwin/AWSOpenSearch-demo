
import AWS from "aws-sdk";

const { ELASTIC_LAMBDA_ARN } = process.env;


const buildResponse = (statusCode, body, isHtml) => {
  const respObj = {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
  };
  if (isHtml) {
    respObj.headers["Content-Type"] = "text/html";
    respObj.body = body;
  } else {
    respObj.body = JSON.stringify(body);
  }
  return respObj;
};
export function success(body) {
  return buildResponse(200, body);
}

export function successHTML(html) {
  return buildResponse(200, html, true);
}

export function failure(body) {
  body = body || { status: false, error: "Invalid Request" };
  return buildResponse(500, body);
}
export function badRequest(body) {
  body = body || { status: false, error: "Bad Request" };
  return buildResponse(400, body);
}
export function notFound(body) {
  body = body || { status: false, error: "Not found" };
  return buildResponse(404, body);
}


// --------------------------

const lambda = new AWS.Lambda();

const invokeLambda = async (functionArn, payload, isAsync = false) => {
  let invokeResp = null;
  try {
    const lambdaInvokeParams = {
      FunctionName: functionArn,
      Payload: JSON.stringify(payload, null, 2)
    }

    if (isAsync)
      lambdaInvokeParams.InvocationType = "Event";

    invokeResp = await lambda.invoke(lambdaInvokeParams).promise();

    /**debugger */
    console.log(`invokeResp: ${JSON.stringify(invokeResp)}`);
    /**debugger */

  } catch (error) {
    console.log(`Error: ${JSON.stringify(error)}`);
  }
  return invokeResp;
}

export const initLambdaInvoke = async ({
  action = "",
  httpMethod = "",
  body = null,
  arn = "",
  type = "",
  getBody = false
}) => {
  console.log(JSON.stringify({action, httpMethod, body, arn}));
  if (action && httpMethod && body && arn) {
    // Prepare the data for lambda event
    const eventObj = {
      httpMethod,
      pathParameters: {
        action,
      },
    };
    // Use body inside eventObj.pathParameters if httpMethod is GET. Otherwise as Body
    if (httpMethod === "GET")
      eventObj.pathParameters = { ...eventObj.pathParameters, ...body };
    else eventObj.body = JSON.stringify(body, null, 2);
    // Add type if supplied as a parameter
    if (type) eventObj.pathParameters.type = type;
    console.log(`arn: ${arn}`);
    console.log(`eventObj: ${JSON.stringify(eventObj)}`);
    const invokeEventResp = await invokeLambda(arn, eventObj, false);
    console.log(`invokeEventResp: ${JSON.stringify(invokeEventResp)}`);
    let { Payload: response } = invokeEventResp;
    response = JSON.parse(response);
    console.log(`Payload: ${JSON.stringify(response)}`);
    // Send the response body
    if (getBody) {
      let { body: respBody = null } = response;
      respBody = respBody && JSON.parse(respBody);
      console.log(`Payload body: ${JSON.stringify(respBody)}`);
      return respBody;
    }
    return response;
  }
  return { status: false, error: "Please provide valid parameters" };
}


const sendRequest = async (params) => {

  try {
    const listResponse = await initLambdaInvoke({
      action: "elastic",
      type: "",
      httpMethod: 'POST',
      body: params,
      arn: ELASTIC_LAMBDA_ARN
    });
    return { status: true, data: listResponse };
  } catch (error) {
    return { status: false, error }
  };
};

const queryMaker = (method, path, payload) => {
  const params = {
    httpMethod: method,
    requestPath: path,
    isGlobal: true,
  };
  if (payload) {
    params.payload = payload;
  }
  console.log(`esParams: ${JSON.stringify(params)}`);
  return params;
};


export const getAllIndexes = async () => {
  try {
    const params = queryMaker("GET", "/_cat/indices", null);
    const resp = await sendRequest(params);
    console.log(`getAllIndexes-resp: ${JSON.stringify(resp)}`);
    return success({ status: true, result: resp });
  } catch (e) {
    console.log(`getAllIndexes-error: ${JSON.stringify(e.stack)}`);
    return failure({ status: false, error: e.message, lambda: "crmTrail" });
  }
};


export const getIndexCount = async (data) => {
  try {
    const { indexName = "" } = data;
    if (!indexName)
      return failure({ status: false, error: "IndexName is required" });
    const params = queryMaker("GET", `/_cat/count/${indexName}?h=count`, null);
    const resp = await sendRequest(params);
    return success({ status: true, result: resp });
  } catch (e) {
    console.log(`getAllIndexes-error: ${JSON.stringify(e.stack)}`);
    return failure({ status: false, error: e.message });
  }
};


export const main = async (event) => {
  return getAllIndexes()
};