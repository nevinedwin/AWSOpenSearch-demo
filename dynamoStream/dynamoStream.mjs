export const main = async (event) => {

    console.log(`Recieved Event: ${JSON.stringify(event)}`);
    return {
        statusCode: 200,
        body: JSON.stringify(event)
    }    
};