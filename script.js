:root {
    --primary-color: #ff6b6b;
    --secondary-color: #4ecdc4;
    --background-color: rgba(255, 255, 255, 0.95);
    --text-color: #2c3e50;
}

body {
    margin: 0;
    padding: 0;
    font-family: 'Arial', sans-serif;
    background: url('images/floral-bg.png') repeat;
    color: var(--text-color);
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

header {
    text-align: center;
    margin-bottom: 40px;
}

.logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
}

.logo img {
    width: 80px;
    height: 80px;
}

.logo h1 {
    font-size: 2.5em;
    color: var(--primary-color);
    margin: 0;
}

main {
    background-color: var(--background-color);
    border-radius: 15px;
    padding: 30px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.upload-section {
    text-align: center;
    margin-bottom: 40px;
}

.input-buttons {
    display: flex;
    gap: 20px;
    justify-content: center;
    margin-top: 20px;
}

.btn {
    padding: 12px 24px;
    background-color: var(--secondary-color);
    color: white;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    font-size: 1.1em;
    transition: transform 0.2s;
}

.btn:hover {
    transform: scale(1.05);
}

.hidden {
    display: none;
}

.results-section {
    margin-top: 40px;
}

.results-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
}

.image-preview img {
    max-width: 100%;
    border-radius: 10px;
}

.analysis-results {
    padding: 20px;
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

#camera, #canvas {
    max-width: 100%;
    margin: 20px auto;
    border-radius: 10px;
}

.analysis-details {
    padding: 15px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 8px;
    margin-top: 15px;
}

.color-swatch {
    display: inline-block;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    margin-right: 10px;
    vertical-align: middle;
    border: 1px solid #ddd;
}

.analysis-details ul {
    list-style: none;
    padding-left: 0;
}

.analysis-details li {
    margin-bottom: 10px;
    padding: 8px;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 4px;
}

.debug-section {
    margin-top: 30px;
    padding: 20px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 8px;
}

.debug-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
}

.debug-box {
    background: white;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.debug-box pre {
    white-space: pre-wrap;
    word-wrap: break-word;
    background: #f5f5f5;
    padding: 10px;
    border-radius: 4px;
    font-size: 0.9em;
    max-height: 200px;
    overflow-y: auto;
} 
