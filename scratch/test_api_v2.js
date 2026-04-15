import http from 'http';

const id = '69de1d6a355b64c098b6a55f';
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
