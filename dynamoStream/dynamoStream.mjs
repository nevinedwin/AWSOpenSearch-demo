export const main = async (event) => {

    console.log(`Recieved Event: ${event}`);
    return {
        statusCode: 200,
        body: JSON.stringify(event)
    }    
};