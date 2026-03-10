<?php?>

<script>
function downloadQrCertificate(data) {
    const certCanvas = document.createElement('canvas');
    certCanvas.width = 1000;
    certCanvas.height = 1200;
    const ctx = certCanvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, certCanvas.width, certCanvas.height);
    ctx.fillStyle = '#559CDA';
    ctx.fillRect(0, 0, certCanvas.width, 120);
    
   
    const logoImg = new Image();
    let imagesLoaded = 0;
    
    logoImg.onload = () => {
        imagesLoaded++;
        if (imagesLoaded === 1) drawCertificateContent();
    };
    
    logoImg.onerror = () => {
        imagesLoaded++;
        if (imagesLoaded === 1) drawCertificateContent();
    };
    
    logoImg.src = '../assets/ITI.jpg';
    
    function drawCertificateContent() {
    
        if (logoImg.complete && logoImg.naturalHeight !== 0) {
            ctx.drawImage(logoImg, 30, 30, 60, 60);
        }
        
      
        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = '#559CDA';
        ctx.textAlign = 'center';
        ctx.fillText('Event Registration Certificate', certCanvas.width / 2, 180);
        
        // Div line
        ctx.strokeStyle = '#7BADFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(50, 200);
        ctx.lineTo(certCanvas.width - 50, 200);
        ctx.stroke();
     
        const colWidth = (certCanvas.width - 120) / 2;
        const leftColX = 50;
        const rightColX = 50 + colWidth + 20;
        const contentStartY = 240;
        
        //REGISTRATION DETAILS
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#ED8028';
        ctx.textAlign = 'left';
        ctx.fillText('Registration Details', leftColX, contentStartY);
        
        const detailsStartY = contentStartY + 40;
        const lineHeight = 35;
        let yPos = detailsStartY;
        
       
        function drawDetail(label, value) {
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = '#1f2937';
            ctx.fillText(label + ':', leftColX, yPos);
            
            ctx.font = '14px Arial';
            ctx.fillStyle = '#374151';
            const truncatedValue = value.length > 25 ? value.substring(0, 22) + '...' : value;
            ctx.fillText(truncatedValue, leftColX + 140, yPos);
            
            yPos += lineHeight;
        }
        
        // Use passed data from reg form
        drawDetail('Name', data.lastName + ', ' + data.firstName);
        drawDetail('Email', data.email);
        drawDetail('Phone', data.phone);
        drawDetail('Company', data.company);
        drawDetail('Job Title', data.jobTitle);
        
        //EVENT DETAILS 
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#ED8028';
        ctx.textAlign = 'left';
        ctx.fillText('Event Details', rightColX, contentStartY);
        
        yPos = detailsStartY;
        
        function drawEventDetail(label, value) {
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = '#1f2937';
            ctx.fillText(label + ':', rightColX, yPos);
            
            ctx.font = '14px Arial';
            ctx.fillStyle = '#374151';
            const truncatedValue = value.length > 28 ? value.substring(0, 25) + '...' : value;
            ctx.fillText(truncatedValue, rightColX + 140, yPos);
            
            yPos += lineHeight;
        }
        
        // Get event details from passed data
        drawEventDetail('Event Name', data.eventName);
        drawEventDetail('Date & Time', data.eventDateTime);
        drawEventDetail('Venue', data.eventLocation);
        
        yPos = Math.max(detailsStartY + (5 * lineHeight) + 30, 550);
        ctx.strokeStyle = '#7BADFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(50, yPos);
        ctx.lineTo(certCanvas.width - 50, yPos);
        ctx.stroke();
        
        // Registration Code Section
        const qrStartY = yPos + 40;
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#1f2937';
        ctx.textAlign = 'center';
        ctx.fillText('Registration Code', certCanvas.width / 2, qrStartY);
        
        // Registration code box 
        ctx.font = 'bold 22px Courier New';
        ctx.fillStyle = '#559CDA';
        ctx.fillText(data.registrationCode, certCanvas.width / 2, qrStartY + 40);
        
        // QR Code Section
        const qrContainerY = qrStartY + 80;
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#1f2937';
        ctx.textAlign = 'center';
        ctx.fillText('Scan for Entry', certCanvas.width / 2, qrContainerY);
        
        // Draw QR code in center
        if (data.qrCanvas) {
            const qrImage = data.qrCanvas.toDataURL('image/png');
            const qrImg = new Image();
            qrImg.onload = function() {
                const qrSize = 220;
                ctx.drawImage(qrImg, (certCanvas.width - qrSize) / 2, qrContainerY + 20, qrSize, qrSize);
                
                // Message at bottom
                const messageY = qrContainerY + qrSize + 50;
                ctx.font = 'bold 16px Arial';
                ctx.fillStyle = '#ED8028';
                ctx.textAlign = 'center';
                ctx.fillText('Please bring the QR code on the day of the event', certCanvas.width / 2, messageY);
                ctx.fillText('for verification.', certCanvas.width / 2, messageY + 25);
                
                // Bottom border
                ctx.fillStyle = '#ED8028';
                ctx.fillRect(0, certCanvas.height - 8, certCanvas.width, 8);
                
                // Download the certificate
                certCanvas.toBlob(function(blob) {
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Event-Registration-${data.registrationCode}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                }, 'image/png');
            };
            qrImg.src = qrImage;
        }
    }
}
</script>
