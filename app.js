let videoElement = document.getElementById('video');
let canvasElement = document.getElementById('canvas');
let currentStream;
let useFrontCamera = true;
let flashEnabled = false;

async function startCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }
    try {
        const constraints = {
            video: {
                facingMode: useFrontCamera ? 'user' : 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 },
                focusMode: 'auto'
            }
        };
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        videoElement.srcObject = currentStream;
        videoElement.style.transform = useFrontCamera ? 'scaleX(-1)' : 'scaleX(1)';
    } catch (err) {
        console.error('Error accessing media devices.', err);
    }
}

document.getElementById('toggleCamera').addEventListener('click', () => {
    useFrontCamera = !useFrontCamera;
    startCamera();
});

document.getElementById('toggleFlashlight').addEventListener('click', async () => {
    if (!currentStream) return;
    const track = currentStream.getVideoTracks()[0];
    const capabilities = track.getCapabilities();
    if (capabilities.torch) {
        flashEnabled = !flashEnabled;
        await track.applyConstraints({
            advanced: [{ torch: flashEnabled }]
        });
    } else {
        alert('Flashlight is not supported on this device.');
    }
});

const gallery = [];
let currentCropIndex = 0;
let cropper;

// Capture an image and add it to the gallery
document.getElementById('capture').addEventListener('click', () => {
    const context = canvasElement.getContext('2d');
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    const imageData = canvasElement.toDataURL('image/png'); 
    gallery.push(imageData);
    alert('Image captured and added to gallery.');
});

// Open the cropper for the first image in the gallery
document.getElementById('gallery').addEventListener('click', () => {
    if (gallery.length === 0) {
        alert('No images in the gallery to crop.');
        return;
    }
    openCropper();
});

function openCropper() {
    const overlay = document.getElementById('overlay');
    const cropContainer = document.getElementById('cropContainer');
    const cropImage = document.getElementById('cropImage');

    overlay.style.display = 'block';
    cropContainer.style.display = 'block';
    cropImage.src = gallery[currentCropIndex];

    if (cropper) cropper.destroy(); // Destroy the previous cropper instance
    cropper = new Cropper(cropImage, {
        aspectRatio: NaN,
        viewMode: 1
    });

    // Apply the crop and update the gallery
    document.getElementById('applyCrop').onclick = () => {
        const croppedCanvas = cropper.getCroppedCanvas();
        const croppedImage = croppedCanvas.toDataURL('image/png');
        gallery[currentCropIndex] = croppedImage; // Update the image in the gallery
        alert('Crop applied successfully!');
    };

    // Delete the current image from the gallery
    document.getElementById('deleteImage').onclick = () => {
        gallery.splice(currentCropIndex, 1); // Remove the current image
        if (gallery.length > 0) {
            currentCropIndex = Math.min(currentCropIndex, gallery.length - 1);
            cropImage.src = gallery[currentCropIndex];
            cropper.replace(gallery[currentCropIndex]);
        } else {
            closeCropper();
            alert('All images have been deleted.');
        }
    };

    // Recapture the image by replacing the current image
    document.getElementById('recaptureImage').onclick = () => {
        const context = canvasElement.getContext('2d');
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
        const newImageData = canvasElement.toDataURL('image/png');
        gallery[currentCropIndex] = newImageData;
        cropImage.src = newImageData;
        cropper.replace(newImageData);
        alert('Image recaptured successfully!');
    };

    document.getElementById('cancelCrop').onclick = () => {
        closeCropper();
    };
}

function closeCropper() {
    const overlay = document.getElementById('overlay');
    const cropContainer = document.getElementById('cropContainer');
    if (cropper) cropper.destroy();
    overlay.style.display = 'none';
    cropContainer.style.display = 'none';
}

// Save all images in the gallery
document.getElementById('saveAll').addEventListener('click', () => {
    if (gallery.length === 0) {
        alert('No images to save.');
        return;
    }

    gallery.forEach((image, index) => {
        const link = document.createElement('a');
        link.href = image;
        link.download = `image_${index + 1}.png`;
        link.click();
    });

    alert('All images saved to your device.');
});

document.getElementById('prevImage').onclick = () => {
    if (gallery.length === 0) {
        alert('No images in the gallery.');
        return;
    }
    // Move to the previous image, looping back if at the start
    currentCropIndex = (currentCropIndex - 1 + gallery.length) % gallery.length;
    const cropImage = document.getElementById('cropImage');
    cropImage.src = gallery[currentCropIndex];
    cropper.replace(gallery[currentCropIndex]);
    alert(`Showing image ${currentCropIndex + 1} of ${gallery.length}`);
};

document.getElementById('nextImage').onclick = () => {
    if (gallery.length === 0) {
        alert('No images in the gallery.');
        return;
    }
    // Move to the next image, looping back if at the end
    currentCropIndex = (currentCropIndex + 1) % gallery.length;
    const cropImage = document.getElementById('cropImage');
    cropImage.src = gallery[currentCropIndex];
    cropper.replace(gallery[currentCropIndex]);
    alert(`Showing image ${currentCropIndex + 1} of ${gallery.length}`);
};


startCamera();
