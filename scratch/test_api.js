import http from 'http';

const id = '69df0c814ff53d5a58b6e074';
const url = `http://localhost:5000/api/applications/resume/${id}`;

http.get(url, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('BODY:', data);
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
