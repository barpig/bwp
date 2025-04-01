const fs = require('fs');
const path = require('path');

const metadataFilepath = path.join('C:\\Users\\rendo\\Documents\\GitHub\\bwp', 'posts.json');
const testData = {
    "test": {
        "message": "This is a test"
    }
};

try {
    console.log('Attempting to write to:', metadataFilepath);
    fs.writeFileSync(metadataFilepath, JSON.stringify(testData, null, 2));
    console.log('Successfully wrote to posts.json');
} catch (error) {
    console.error('Error writing to posts.json:', error.message);
}