class FloralBot {
    constructor() {
        this.fileInput = document.getElementById('fileInput');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.cameraBtn = document.getElementById('cameraBtn');
        this.camera = document.getElementById('camera');
        this.canvas = document.getElementById('canvas');
        this.resultsSection = document.querySelector('.results-section');
        this.previewImage = document.getElementById('previewImage');
        this.flowerResults = document.getElementById('flowerResults');

        // Get configuration from environment
        this.storageAccount = process.env.STORAGE_ACCOUNT;
        this.storageContainer = process.env.STORAGE_CONTAINER;
        this.visionApiKey = process.env.VISION_API_KEY;
        this.visionEndpoint = process.env.VISION_ENDPOINT;

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.uploadBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleImageUpload(e));
        this.cameraBtn.addEventListener('click', () => this.toggleCamera());
    }

    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            try {
                // Upload to Azure Blob Storage
                const blobName = `flower-${Date.now()}-${file.name}`;
                const imageUrl = await this.uploadToBlob(file, blobName);
                
                this.previewImage.src = imageUrl;
                this.resultsSection.classList.remove('hidden');
                
                // Analyze the image
                const base64Image = await this.convertToBase64(file);
                await this.analyzeImage(base64Image);
            } catch (error) {
                console.error('Error handling image:', error);
                alert('Error uploading image. Please try again.');
            }
        }
    }

    async toggleCamera() {
        if (this.camera.classList.contains('hidden')) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                this.camera.srcObject = stream;
                this.camera.classList.remove('hidden');
                this.camera.play();
            } catch (err) {
                console.error('Error accessing camera:', err);
                alert('Unable to access camera');
            }
        } else {
            const stream = this.camera.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            this.camera.classList.add('hidden');
        }
    }

    async convertToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async analyzeImage(base64Image) {
        try {
            const response = await fetch(`${this.visionEndpoint}/vision/v3.2/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Ocp-Apim-Subscription-Key': this.visionApiKey
                },
                body: this.base64ToBlob(base64Image),
                params: {
                    'visualFeatures': 'Objects,Color,Description,Tags',
                    'language': 'en',
                    'model-version': 'latest'
                }
            });

            const data = await response.json();
            
            // Process the results to identify flowers
            const flowerAnalysis = {
                flowers: [],
                colors: data.color.dominantColors,
                confidence: 0
            };

            // Check tags for flower-related items
            if (data.tags) {
                data.tags.forEach(tag => {
                    if (tag.name.includes('flower') || 
                        tag.name.includes('rose') || 
                        tag.name.includes('tulip') || 
                        tag.name.includes('daisy') ||
                        tag.name.includes('lily')) {
                        flowerAnalysis.flowers.push({
                            type: tag.name,
                            confidence: tag.confidence
                        });
                    }
                });
            }

            // Update the display with detailed results
            this.displayResults(flowerAnalysis);
        } catch (error) {
            console.error('Error analyzing image:', error);
            this.flowerResults.innerHTML = 'Error analyzing image. Please try again.';
        }
    }

    base64ToBlob(base64) {
        const binaryString = window.atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new Blob([bytes], { type: 'application/octet-stream' });
    }

    displayResults(analysis) {
        let resultsHtml = '<div class="analysis-details">';
        
        // Display detected flowers
        if (analysis.flowers.length > 0) {
            resultsHtml += '<h4>Detected Flowers:</h4><ul>';
            analysis.flowers.forEach(flower => {
                resultsHtml += `
                    <li>
                        <strong>Type:</strong> ${flower.type.charAt(0).toUpperCase() + flower.type.slice(1)}
                        <br>
                        <strong>Confidence:</strong> ${(flower.confidence * 100).toFixed(1)}%
                    </li>
                `;
            });
            resultsHtml += '</ul>';
        } else {
            resultsHtml += '<p>No specific flowers detected in the image.</p>';
        }

        // Display colors
        if (analysis.colors && analysis.colors.length > 0) {
            resultsHtml += '<h4>Dominant Colors:</h4><ul>';
            analysis.colors.forEach(color => {
                resultsHtml += `
                    <li>
                        <span class="color-swatch" style="background-color: ${color.toLowerCase()}"></span>
                        ${color}
                    </li>
                `;
            });
            resultsHtml += '</ul>';
        }

        resultsHtml += '</div>';
        this.flowerResults.innerHTML = resultsHtml;
    }

    async uploadToBlob(file, blobName) {
        const blobUrl = `https://${this.storageAccount}.blob.core.windows.net/${this.storageContainer}/${blobName}${this.sasToken}`;
        
        await fetch(blobUrl, {
            method: 'PUT',
            headers: {
                'x-ms-blob-type': 'BlockBlob',
                'Content-Type': file.type
            },
            body: file
        });

        return blobUrl.split('?')[0]; // Return URL without SAS token
    }
}

// Initialize the FloralBot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FloralBot();
}); 