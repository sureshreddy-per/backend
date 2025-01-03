# Produce Management Guide

This guide explains how to manage produce listings in the application.

## Creating a Produce Listing

Customers can create new produce listings with details about their agricultural products.

\`\`\`typescript
// Create a new produce listing
const createProduce = async (produceData: FormData) => {
  const response = await fetch('/produce', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${token}\`,
    },
    body: produceData, // Using FormData for file uploads
  });

  return response.json();
};

// Example usage with photos and video
const formData = new FormData();
formData.append('type', 'WHEAT');
formData.append('quantity', '1000');
formData.append('unit', 'KG');
formData.append('expectedPrice', '500');
formData.append('description', 'High-quality wheat harvest');
formData.append('photos', photoFile1);
formData.append('photos', photoFile2);
formData.append('video', videoFile);
formData.append('location', JSON.stringify({
  lat: 12.345678,
  lng: 98.765432,
}));

const produce = await createProduce(formData);
\`\`\`

## Quality Assessment

Add quality parameters to a produce listing.

\`\`\`typescript
// Add quality assessment
const addQualityAssessment = async (produceId: string, qualityData: any) => {
  const response = await fetch(\`/produce/\${produceId}/quality\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(qualityData),
  });

  return response.json();
};

// Example quality data for wheat
const qualityData = {
  moistureContent: 12.5,
  proteinContent: 11.8,
  testWeight: 78.5,
  fallingNumber: 350,
  foreignMatter: 0.5,
  damagedKernels: 1.2,
};

await addQualityAssessment('produce-id', qualityData);
\`\`\`

## Fetching Produce Listings

Different ways to fetch and filter produce listings.

\`\`\`typescript
// Get all produce listings
const getAllProduce = async () => {
  const response = await fetch('/produce', {
    headers: {
      'Authorization': \`Bearer \${token}\`,
    },
  });

  return response.json();
};

// Get produce by type
const getProduceByType = async (type: string) => {
  const response = await fetch(\`/produce?type=\${type}\`, {
    headers: {
      'Authorization': \`Bearer \${token}\`,
    },
  });

  return response.json();
};

// Get produce by location (within radius)
const getProduceByLocation = async (lat: number, lng: number, radiusKm: number) => {
  const response = await fetch(
    \`/produce?lat=\${lat}&lng=\${lng}&radius=\${radiusKm}\`,
    {
      headers: {
        'Authorization': \`Bearer \${token}\`,
      },
    }
  );

  return response.json();
};
\`\`\`

## Updating Produce Status

Update the status of a produce listing.

\`\`\`typescript
// Update produce status
const updateProduceStatus = async (produceId: string, status: string) => {
  const response = await fetch(\`/produce/\${produceId}/status\`, {
    method: 'PATCH',
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  return response.json();
};

// Example statuses
enum ProduceStatus {
  AVAILABLE = 'AVAILABLE',
  UNDER_OFFER = 'UNDER_OFFER',
  SOLD = 'SOLD',
  WITHDRAWN = 'WITHDRAWN',
}

await updateProduceStatus('produce-id', ProduceStatus.UNDER_OFFER);
\`\`\`

## Media Management

Handle produce photos and videos.

\`\`\`typescript
// Upload additional photos
const uploadPhotos = async (produceId: string, photos: File[]) => {
  const formData = new FormData();
  photos.forEach(photo => {
    formData.append('photos', photo);
  });

  const response = await fetch(\`/produce/\${produceId}/photos\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${token}\`,
    },
    body: formData,
  });

  return response.json();
};

// Delete a photo
const deletePhoto = async (produceId: string, photoId: string) => {
  const response = await fetch(
    \`/produce/\${produceId}/photos/\${photoId}\`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': \`Bearer \${token}\`,
      },
    }
  );

  return response.ok;
};
\`\`\`

## Error Handling

Common errors when managing produce.

\`\`\`typescript
// Invalid produce data
{
  "statusCode": 400,
  "message": "Invalid produce data",
  "errors": [
    {
      "field": "quantity",
      "message": "Quantity must be a positive number"
    }
  ]
}

// Unauthorized access
{
  "statusCode": 403,
  "message": "Only customers can create produce listings",
  "error": "Forbidden"
}

// Not found
{
  "statusCode": 404,
  "message": "Produce not found",
  "error": "Not Found"
}
\`\`\`

## WebSocket Events

Listen for real-time updates on produce listings.

\`\`\`typescript
import { io } from 'socket.io-client';

const socket = io('ws://localhost:3000/produce', {
  auth: {
    token: 'your_jwt_token_here',
  },
});

// Listen for new produce listings
socket.on('newProduce', (produce) => {
  console.log('New produce listing:', produce);
});

// Listen for produce updates
socket.on('produceUpdated', (produce) => {
  console.log('Produce updated:', produce);
});

// Listen for produce status changes
socket.on('produceStatusChanged', ({ produceId, status }) => {
  console.log(\`Produce \${produceId} status changed to \${status}\`);
});
\`\`\` 