const testLogin = async () => {
    try {
        console.log("Sending POST request to http://localhost:5000/api/users/login");
        const resp = await fetch('http://localhost:5000/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'testuser_debug',
                password: 'somepassword'
            })
        });
        
        console.log("Response Status:", resp.status);
        const data = await resp.json();
        console.log("Response Data:", data);
    } catch (err) {
        console.log("Fetch Error:", err.message);
    }
};

testLogin();
