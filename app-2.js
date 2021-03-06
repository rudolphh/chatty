const express = require('express');
const redis = require('redis');
const axios = require('axios');
const { json } = require('express');
const app = express();
const port = 3000;

// connect redis
const client = redis.createClient({
    host: '127.0.0.1',
    port: 6379
});


const apiUrl = 'https://en.wikipedia.org/w/api.php?action=parse&format=json&section=0&page=';


app.get('/async/:key', async (req, res) => {

    let key = encodeURI(req.params.key);

    try {
      const value = await axios.get(`${apiUrl}${key}`); 
       return res.status(200).send({
        error: false,
        data: value.data
      });
     
    } catch (error) {
        console.log(error)
    }
});


app.get('/:queryKey', (req, res) => {

    let queryKey = encodeURI(req.params.queryKey);

    client.get(queryKey, (err, strValue) => {
        if(err) return console.log(err);
        if(strValue){
            // we have the value of the key set in redis
            console.log('from cache');
            let jsonValue = JSON.parse(strValue); // parse the value string into json
            res.send(jsonValue.parse.text['*']);
        } else {
            
            // there was no key so make an api call
            console.log('from api');
            axios.get(apiUrl + queryKey).then(response => {
                client.set(queryKey, JSON.stringify(response.data));// store json obj as string
                res.send(response.data.parse.text['*']);
            });
        }
    });


});

app.listen(port, () => {
    console.log(`app is running on port ${port}`);
})