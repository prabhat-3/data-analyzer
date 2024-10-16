document.getElementById('analyze-btn').addEventListener('click', async function() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];

    if (!file) {
        alert("Please upload a file");
        return;
    }

    // Check file type (Excel or PDF)
    const fileType = file.name.split('.').pop().toLowerCase();

    if (fileType === 'xlsx') {
        // Handle Excel file
        const excelData = await readExcelFile(file);
        sendToChatGPT(excelData);
    } else if (fileType === 'pdf') {
        // Handle PDF file
        const pdfData = await readPdfFile(file);
        sendToChatGPT(pdfData);
    } else {
        alert('Unsupported file type! Please upload an Excel or PDF file.');
    }
});

async function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);
            resolve(JSON.stringify(jsonData)); // Send as string for analysis
        };
        reader.readAsArrayBuffer(file);
    });
}

async function readPdfFile(file) {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onload = async function(e) {
            const pdfDoc = await PDFLib.PDFDocument.load(e.target.result);
            const page = pdfDoc.getPage(0);
            const text = await page.getTextContent();
            const textItems = text.items.map(item => item.str).join(' ');
            resolve(textItems); // Send extracted text for analysis
        };
        reader.readAsArrayBuffer(file);
    });
}

function sendToChatGPT(fileContent) {
    const data = JSON.stringify({
        messages: [
            {
                role: 'user',
                content: `Analyze the following data: ${fileContent}`
            }
        ],
        system_prompt: '',
        temperature: 0.9,
        top_k: 5,
        top_p: 0.9,
        max_tokens: 256,
        web_access: false
    });

    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener('readystatechange', function () {
        if (this.readyState === this.DONE) {
            const response = JSON.parse(this.responseText);
            document.getElementById('analysis-output').textContent = response.choices[0].message.content;
        }
    });

    xhr.open('POST', 'https://chatgpt-42.p.rapidapi.com/conversationgpt4-2');
    xhr.setRequestHeader('x-rapidapi-key', 'bafef5a549mshd469cf596ac444cp1bf812jsn5c563c2fd67a');
    xhr.setRequestHeader('x-rapidapi-host', 'chatgpt-42.p.rapidapi.com');
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.send(data);
}
