# Produce API Documentation

## Create Produce Listing

`POST /produce`

Create a new produce listing. The request body should match the following structure:

### Basic Example
```json
{
  "category": "FOOD_GRAINS",
  "name": "Premium Basmati Rice",
  "description": "High-quality aged basmati rice with excellent aroma",
  "price": 85,
  "pricePerUnit": 85,
  "currency": "INR",
  "unit": "kg",
  "quantity": 1000,
  "farmId": "5c8c7b88-1aa5-4081-b0a8-5fea4f64a594",
  "location": {
    "latitude": 12.9716,
    "longitude": 77.5946
  }
}
```

### Category-Specific Examples

#### Food Grains Example
```json
{
  "category": "FOOD_GRAINS",
  "name": "Premium Basmati Rice",
  "description": "High-quality aged basmati rice with excellent aroma",
  "price": 85000,
  "pricePerUnit": 85,
  "currency": "INR",
  "unit": "kg",
  "quantity": 1000,
  "farmId": "5c8c7b88-1aa5-4081-b0a8-5fea4f64a594",
  "location": {
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "foodGrains": {
    "variety": "Basmati",
    "grainSize": "MEDIUM",
    "moistureContent": 13.5,
    "foreignMatter": 1.2,
    "proteinContent": 8.5
  }
}
```

#### Fruits Example
```json
{
  "category": "FRUITS",
  "name": "Fresh Alphonso Mangoes",
  "description": "Premium quality Alphonso mangoes from Ratnagiri",
  "price": 4800,
  "pricePerUnit": 400,
  "currency": "INR",
  "unit": "dozen",
  "quantity": 100,
  "farmId": "5c8c7b88-1aa5-4081-b0a8-5fea4f64a594",
  "location": {
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "fruits": {
    "variety": "Alphonso",
    "size": "LARGE",
    "sweetness": 16,
    "ripenessLevel": "RIPE"
  }
}
```

#### Vegetables Example
```json
{
  "category": "VEGETABLES",
  "name": "Fresh Organic Tomatoes",
  "description": "Locally grown organic tomatoes",
  "price": 20000,
  "pricePerUnit": 40,
  "currency": "INR",
  "unit": "kg",
  "quantity": 500,
  "farmId": "5c8c7b88-1aa5-4081-b0a8-5fea4f64a594",
  "location": {
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "vegetables": {
    "variety": "Roma",
    "size": "MEDIUM",
    "freshnessLevel": "VERY_FRESH",
    "color": "RED"
  }
}
```

#### Spices Example
```json
{
  "category": "SPICES",
  "name": "Premium Cardamom",
  "description": "High-quality green cardamom",
  "price": 60000,
  "pricePerUnit": 1200,
  "currency": "INR",
  "unit": "kg",
  "quantity": 50,
  "farmId": "5c8c7b88-1aa5-4081-b0a8-5fea4f64a594",
  "location": {
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "spices": {
    "variety": "Green Cardamom",
    "volatileOilContent": 3.2,
    "aromaQuality": "STRONG",
    "purity": 98.5
  }
}
```

### Request Body Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| category | string | Yes | Category of produce (FOOD_GRAINS, FRUITS, VEGETABLES, etc.) |
| name | string | Yes | Name of the produce |
| description | string | Yes | Detailed description of the produce |
| price | number | No | Total price |
| pricePerUnit | number | No | Price per unit |
| currency | string | No | Currency code (e.g., INR, USD) |
| unit | string | Yes | Unit of measurement (kg, dozen, etc.) |
| quantity | number | Yes | Available quantity |
| farmId | string | No | ID of the farm where produce was grown |
| location | object | Yes | Location coordinates |
| location.latitude | number | Yes | Latitude of the produce location |
| location.longitude | number | Yes | Longitude of the produce location |
| foodGrains | object | No | Food grain specific details (required if category is FOOD_GRAINS) |
| fruits | object | No | Fruit specific details (required if category is FRUITS) |
| vegetables | object | No | Vegetable specific details (required if category is VEGETABLES) |
| spices | object | No | Spice specific details (required if category is SPICES) |
| oilseeds | object | No | Oilseed specific details (required if category is OILSEEDS) |
| fibers | object | No | Fiber specific details (required if category is FIBERS) |
| sugarcane | object | No | Sugarcane specific details (required if category is SUGARCANE) |
| flowers | object | No | Flower specific details (required if category is FLOWERS) |
| medicinalPlants | object | No | Medicinal plant specific details (required if category is MEDICINAL_PLANTS) |

### Response Format

Success Response (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "category": "FOOD_GRAINS",
  "name": "Premium Basmati Rice",
  "description": "High-quality aged basmati rice with excellent aroma",
  "price": 85,
  "unit": "kg",
  "quantity": 1000,
  "farmId": "5c8c7b88-1aa5-4081-b0a8-5fea4f64a594",
  "farmerId": "660e8400-e29b-41d4-a716-446655440000",
  "location": {
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "foodGrains": {
    "variety": "Basmati",
    "grainSize": "MEDIUM",
    "moistureContent": 13.5,
    "foreignMatter": 1.2,
    "proteinContent": 8.5
  },
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z"
}
```

### Error Responses

Invalid Request Format (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "errors": [
    {
      "field": "price",
      "message": "Price must be a positive number"
    },
    {
      "field": "quantity",
      "message": "Quantity must be a positive number"
    }
  ]
}
```

Unauthorized (401 Unauthorized):
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

Farm Not Found (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "Farm not found or does not belong to farmer"
} 