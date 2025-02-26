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

        // Debug elements
        this.visionDebug = document.getElementById('visionDebug');
        this.storageDebug = document.getElementById('storageDebug');
        this.configDebug = document.getElementById('configDebug');

        // Initialize config as null, will be fetched from server
        this.config = null;
        this.loadConfig();

        this.initializeEventListeners();
    }

    async loadConfig() {
        try {
            const response = await fetch('/config');
            if (!response.ok) {
                throw new Error(`Config endpoint returned ${response.status}: ${response.statusText}`);
            }
            this.config = await response.json();
            
            console.log('Client received config:', {
                storageAccount: this.config.STORAGE_ACCOUNT ? 'Present' : 'Missing',
                container: this.config.STORAGE_CONTAINER ? 'Present' : 'Missing',
                sasToken: this.config.SAS_TOKEN ? 'Present' : 'Missing',
                actualSasToken: this.config.SAS_TOKEN, // Temporarily log for debugging
                visionEndpoint: this.config.VISION_ENDPOINT ? 'Present' : 'Missing',
                visionApiKey: this.config.VISION_API_KEY ? 'Present' : 'Missing'
            });

            // Validate config
            if (!this.config.STORAGE_ACCOUNT || !this.config.STORAGE_CONTAINER || !this.config.SAS_TOKEN) {
                throw new Error(`Missing required storage configuration:
                    Storage Account: ${this.config.STORAGE_ACCOUNT ? 'Present' : 'Missing'}
                    Container: ${this.config.STORAGE_CONTAINER ? 'Present' : 'Missing'}
                    SAS Token: ${this.config.SAS_TOKEN ? 'Present' : 'Missing'}
                    SAS Token value: ${this.config.SAS_TOKEN || 'undefined'}`);
            }
            if (!this.config.VISION_ENDPOINT || !this.config.VISION_API_KEY) {
                throw new Error('Missing required Vision API configuration');
            }

            this.configDebug.textContent = 'Configuration loaded:\n' + 
                JSON.stringify({
                    storageAccount: this.config.STORAGE_ACCOUNT,
                    container: this.config.STORAGE_CONTAINER,
                    visionEndpoint: this.config.VISION_ENDPOINT?.substring(0, 30) + '...',
                    hasApiKey: !!this.config.VISION_API_KEY,
                    hasSasToken: !!this.config.SAS_TOKEN,
                    sasTokenLength: this.config.SAS_TOKEN?.length,
                    sasTokenStart: this.config.SAS_TOKEN?.substring(0, 20) + '...',
                    sasTokenValid: this.config.SAS_TOKEN?.startsWith('?')
                }, null, 2);
        } catch (error) {
            console.error('Error loading configuration:', error);
            this.configDebug.textContent = 'Error loading configuration: ' + error.message;
        }
    }

    initializeEventListeners() {
        // Add click event for upload button
        this.uploadBtn.addEventListener('click', () => {
            this.fileInput.click();
        });

        // Add change event for file input
        this.fileInput.addEventListener('change', async (e) => {
            await this.handleImageUpload(e);
        });

        // Add click event for camera button
        this.cameraBtn.addEventListener('click', async () => {
            await this.toggleCamera();
        });

        // Add click event for canvas to capture photo
        this.canvas.addEventListener('click', async () => {
            if (!this.camera.classList.contains('hidden')) {
                await this.capturePhoto();
            }
        });
    }

    async capturePhoto() {
        const context = this.canvas.getContext('2d');
        this.canvas.width = this.camera.videoWidth;
        this.canvas.height = this.camera.videoHeight;
        context.drawImage(this.camera, 0, 0, this.canvas.width, this.canvas.height);

        // Convert canvas to blob
        const blob = await new Promise(resolve => this.canvas.toBlob(resolve, 'image/jpeg'));
        const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });

        // Process the captured photo
        await this.processImage(file);
        
        // Stop the camera
        await this.toggleCamera();
    }

    async processImage(file) {
        try {
            this.storageDebug.textContent = `Processing image: ${file.name}\nSize: ${(file.size/1024).toFixed(2)}KB`;
            
            // Upload to Azure Blob Storage
            const blobName = `flower-${Date.now()}-${file.name}`;
            this.storageDebug.textContent += '\nUploading to blob storage...';
            const imageUrl = await this.uploadToBlob(file, blobName);
            
            this.previewImage.src = imageUrl;
            this.resultsSection.classList.remove('hidden');
            
            this.storageDebug.textContent += '\nUpload successful!\nURL: ' + imageUrl;
            
            // Analyze the image
            const base64Image = await this.convertToBase64(file);
            this.visionDebug.textContent = 'Converting image and sending to Azure Vision API...';
            await this.analyzeImage(base64Image);
        } catch (error) {
            console.error('Error processing image:', error);
            this.storageDebug.textContent += '\nError: ' + error.message;
            alert('Error processing image. Please try again.');
        }
    }

    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            await this.processImage(file);
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
            this.visionDebug.textContent = 'Sending request to Azure Vision API...';
            const response = await fetch(`${this.config.VISION_ENDPOINT}/vision/v3.2/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Ocp-Apim-Subscription-Key': this.config.VISION_API_KEY
                },
                body: this.base64ToBlob(base64Image),
                query: {
                    'visualFeatures': 'Objects,Color,Description,Tags',
                    'language': 'en',
                    'model-version': 'latest',
                    'detail': 'high',
                    'description': 'This is an image of flowers. Please identify the types of flowers, count of each flower type, and their colors.'
                }
            });

            if (!response.ok) {
                throw new Error(`API responded with status: ${response.status}`);
            }

            const data = await response.json();
            this.visionDebug.textContent = 'API Response:\n' + JSON.stringify(data, null, 2);
            
            // Process the results to identify flowers
            const flowerAnalysis = {
                flowers: [],
                colors: data.color?.dominantColors || [],
                description: data.description?.captions?.[0]?.text || '',
                confidence: 0
            };

            // Check tags for flower-related items
            if (data.tags) {
                data.tags.forEach(tag => {
                    if (tag.name.includes('flower') || 
                        tag.name.includes('rose') || 
                        tag.name.includes('tulip') || 
                        tag.name.includes('daisy') ||
                        tag.name.includes('lily') ||
                        tag.name.includes('orchid') ||
                        tag.name.includes('sunflower') ||
                        tag.name.includes('iris') ||
                        tag.name.includes('peony')) {
                        flowerAnalysis.flowers.push({
                            type: tag.name,
                            confidence: tag.confidence
                        });
                    }
                });
            }

            // Check objects for additional flower detections
            if (data.objects) {
                data.objects.forEach(obj => {
                    if (obj.object.toLowerCase().includes('flower') ||
                        obj.object.toLowerCase().includes('bouquet')) {
                        flowerAnalysis.flowers.push({
                            type: obj.object,
                            confidence: obj.confidence
                        });
                    }
                });
            }

            // Update the display with detailed results
            this.displayResults(flowerAnalysis);
        } catch (error) {
            console.error('Error analyzing image:', error);
            this.visionDebug.textContent = 'Error analyzing image:\n' + error.message;
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
        
        // Display the uploaded image
        resultsHtml += `
            <div class="analyzed-image">
                <h4>Analyzed Image:</h4>
                <img src="${this.previewImage.src}" alt="Analyzed flower image" class="result-image">
            </div>
        `;

        // Display AI description
        if (analysis.description) {
            resultsHtml += `
                <div class="ai-description">
                    <h4>AI Description:</h4>
                    <p>${analysis.description}</p>
                </div>
            `;
        }
        
        // Display detected flowers
        if (analysis.flowers.length > 0) {
            resultsHtml += '<h4>Detected Flowers:</h4><ul>';
            // Group similar flowers and count them
            const flowerCounts = analysis.flowers.reduce((acc, flower) => {
                const type = flower.type.toLowerCase();
                if (!acc[type]) {
                    acc[type] = { count: 1, confidence: flower.confidence };
                } else {
                    acc[type].count++;
                    acc[type].confidence = Math.max(acc[type].confidence, flower.confidence);
                }
                return acc;
            }, {});

            Object.entries(flowerCounts).forEach(([type, data]) => {
                resultsHtml += `
                    <li>
                        <strong>Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)}
                        <br>
                        <strong>Count:</strong> ${data.count}
                        <br>
                        <strong>Confidence:</strong> ${(data.confidence * 100).toFixed(1)}%
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
        this.storageDebug.textContent = `Preparing to upload ${file.name} to blob storage...`;
        const baseUrl = `https://${this.config.STORAGE_ACCOUNT}.blob.core.windows.net/${this.config.STORAGE_CONTAINER}/${blobName}`;
        this.storageDebug.textContent += `\nTarget URL: ${baseUrl}\nSAS Token starts with: ${this.config.SAS_TOKEN?.substring(0, 10)}...`;
        
        const blobUrl = baseUrl + this.config.SAS_TOKEN;
        
        try {
            const response = await fetch(blobUrl, {
                method: 'PUT',
                headers: {
                    'x-ms-blob-type': 'BlockBlob',
                    'Content-Type': file.type,
                    'x-ms-version': '2020-04-08',
                    'Access-Control-Allow-Origin': '*'
                },
                body: file,
                mode: 'cors'
            });

            if (!response.ok) {
                const errorText = await response.text();
                this.storageDebug.textContent += `\nResponse status: ${response.status}`;
                this.storageDebug.textContent += `\nResponse text: ${errorText}`;
                throw new Error(`Blob storage error (${response.status}): ${errorText}`);
            }

            this.storageDebug.textContent += '\nUpload successful!';
            return baseUrl; // Return URL without SAS token
        } catch (error) {
            this.storageDebug.textContent += '\nError uploading to blob storage: ' + error.message;
            this.storageDebug.textContent += '\nFull error details:';
            this.storageDebug.textContent += `\n- Error name: ${error.name}`;
            this.storageDebug.textContent += `\n- Error message: ${error.message}`;
            if (error.stack) {
                this.storageDebug.textContent += `\n- Stack trace: ${error.stack}`;
            }
            if (error.message.includes('404')) {
                this.storageDebug.textContent += '\nPossible causes:\n- Container does not exist\n- Storage account name is incorrect';
            } else if (error.message.includes('403')) {
                this.storageDebug.textContent += '\nPossible causes:\n- Invalid SAS token\n- SAS token expired\n- Insufficient permissions';
            }
            throw error;
        }
    }
}

// Initialize the FloralBot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FloralBot();
}); 
