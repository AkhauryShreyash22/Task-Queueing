
require('./server');

const { createClient } = require('redis');
const client = createClient();



client.on('error', (err) => {
    console.error('Redis error:', err);
});

client.connect();  

const { v4: uuidv4 } = require('uuid');

const { faker } = require('@faker-js/faker');





client.on('error', (err) => {
    console.log('Redis error: ' + err);
});

const createUser = async (userId, userData) => {
    try {
        // Store user data in a hash
        await client.hSet(`user:${userId}`, userData);
        console.log('User created:', userData);
    } catch (err) {
        console.error('Error creating user:', err);
    }
};


const uuid = uuidv4();
console.log('Generated UUID:', uuid);

const randomFullName = faker.person.fullName();
console.log('Random Full Name:', randomFullName);

const fakeEmail = faker.internet.email();

console.log('Fake Email Address:', fakeEmail);

createUser(uuid, { name: randomFullName, email: fakeEmail });

client.quit();




console.log('Application started');

