import fs from 'fs';

async function test() {
    const formData = new FormData();
    formData.append('yourName', 'Verification Test');
    formData.append('yourEmail', 'test@verify.com');
    formData.append('mobileNumber', '0000000000');
    formData.append('jobTitle', 'Verification Job');
    formData.append('designation', 'Tester');
    formData.append('description', 'This is a test');
    formData.append('experienceYears', '5');
    formData.append('skills', 'Debugging, Testing');
    formData.append('salaryExpectation', '100000');
    formData.append('jobId', '69de1d0c355b64c098b6a55b');
    
    // Create a dummy file
    fs.writeFileSync('dummy.pdf', 'dummy content');
    const blob = new Blob([fs.readFileSync('dummy.pdf')], { type: 'application/pdf' });
    formData.append('resume', blob, 'dummy.pdf');

    try {
        const response = await fetch('http://localhost:5000/api/applications', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Data:', data);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        fs.unlinkSync('dummy.pdf');
    }
}

test();
