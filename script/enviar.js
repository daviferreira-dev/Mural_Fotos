const api_url = 'https://api-mural.onrender.com/photo';

const video = document.getElementById('video');
const videoContainer = document.getElementById('videoContainer');
const canvas = document.getElementById('canvas');
const capturedImage = document.getElementById('capturedImage');
const fileInput = document.getElementById('fileInput');
const context = canvas.getContext('2d');

let currentLatitude = null;
let currentLongitude = null;

// Pega localização do usuário
function obterLocalizacao() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject('Geolocalização não suportada');
    } else {
      navigator.geolocation.getCurrentPosition(
        pos => {
          currentLatitude = pos.coords.latitude;
          currentLongitude = pos.coords.longitude;
          resolve();
        },
        err => reject('Erro ao obter localização: ' + err.message)
      );
    }
  });
}

// Começa a câmera
function comecarCamera() {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        video.srcObject = stream;
        videoContainer.style.display = 'block';
      })
      .catch(err => alert('Erro ao acessar a câmera: ' + err.message));
  } else {
    alert('Câmera não disponível.');
  }
}

// Captura foto e envia
async function capturePhoto() {
  try {
    await obterLocalizacao();

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async blob => {
      capturedImage.src = URL.createObjectURL(blob);
      capturedImage.style.display = 'block';

      enviarImagem(blob, currentLatitude, currentLongitude);
    }, 'image/png');

    // Para a câmera
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
    }
    videoContainer.style.display = 'none';

  } catch (error) {
    alert(error);
  }
}

// Upload: envia arquivo selecionado e localização
fileInput.addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    await obterLocalizacao();

    const reader = new FileReader();
    reader.onload = event => {
      capturedImage.src = event.target.result;
      capturedImage.style.display = 'block';
    };
    reader.readAsDataURL(file);

    enviarImagem(file, currentLatitude, currentLongitude);

  } catch (error) {
    alert(error);
  }
});

// Envia imagem + localização para a API
function enviarImagem(imagemFile, lat, lon) {
  const formData = new FormData();
  formData.append('image', imagemFile, 'foto.png');
  formData.append('latitude', lat);
  formData.append('longitude', lon);

  fetch(api_url, {
    method: 'POST',
    body: formData
  })
  .then(res => {
    if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
    return res.json();
  })
  .then(data => {
    alert('Imagem enviada com sucesso!');
    console.log('Resposta API:', data);
  })
  .catch(err => {
    alert('Erro ao enviar imagem: ' + err.message);
    console.error(err);
  });
}
