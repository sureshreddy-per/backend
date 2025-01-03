# Support System Guide

This guide explains how to use the support ticket system.

## Creating Support Tickets

Create new support tickets for various issues.

\`\`\`typescript
// Create a new support ticket
const createTicket = async (ticketData: CreateTicketDto) => {
  const response = await fetch('/support', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ticketData),
  });

  return response.json();
};

// Example ticket creation
const ticket = await createTicket({
  title: 'Payment Issue',
  description: 'Unable to complete transaction #12345',
  type: TicketType.TECHNICAL,
  priority: TicketPriority.HIGH,
});
\`\`\`

## Ticket Management

Manage and track support tickets.

\`\`\`typescript
// Get all tickets (admin only)
const getAllTickets = async () => {
  const response = await fetch('/support', {
    headers: {
      'Authorization': \`Bearer \${token}\`,
    },
  });

  return response.json();
};

// Get user's tickets
const getMyTickets = async () => {
  const response = await fetch('/support/my-tickets', {
    headers: {
      'Authorization': \`Bearer \${token}\`,
    },
  });

  return response.json();
};

// Get ticket by ID
const getTicket = async (ticketId: string) => {
  const response = await fetch(\`/support/\${ticketId}\`, {
    headers: {
      'Authorization': \`Bearer \${token}\`,
    },
  });

  return response.json();
};

// Update ticket status (admin only)
const updateTicketStatus = async (ticketId: string, status: TicketStatus) => {
  const response = await fetch(\`/support/\${ticketId}\`, {
    method: 'PUT',
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  return response.json();
};
\`\`\`

## Adding Responses

Add responses to support tickets.

\`\`\`typescript
// Add a response to a ticket
const addResponse = async (ticketId: string, response: string) => {
  const response = await fetch(\`/support/\${ticketId}/responses\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ response }),
  });

  return response.json();
};

// Example response
await addResponse('ticket-id', 'We are looking into your payment issue...');
\`\`\`

## Support Statistics

Get statistics about support tickets (admin only).

\`\`\`typescript
// Get support statistics
const getStatistics = async () => {
  const response = await fetch('/support/statistics', {
    headers: {
      'Authorization': \`Bearer \${token}\`,
    },
  });

  return response.json();
};

// Example response
// {
//   totalTickets: 100,
//   openTickets: 25,
//   resolvedTickets: 75,
//   averageResolutionTime: 48.5 // in hours
// }
\`\`\`

## Real-time Updates

Listen for ticket updates via WebSocket.

\`\`\`typescript
import { io } from 'socket.io-client';

const socket = io('ws://localhost:3000/support', {
  auth: {
    token: 'your_jwt_token_here',
  },
});

// Listen for ticket updates
socket.on('ticketUpdated', (ticket) => {
  console.log('Ticket updated:', ticket);
});

// Listen for new responses
socket.on('ticketResponse', ({ ticketId, response }) => {
  console.log(\`New response on ticket \${ticketId}:\`, response);
});
\`\`\`

## Complete React Example

Example of a support ticket management component.

\`\`\`typescript
import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Ticket {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  responses: Array<{
    message: string;
    createdAt: Date;
    isAdminResponse: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const SupportComponent: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [newResponse, setNewResponse] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io('ws://localhost:3000/support', {
      auth: {
        token: localStorage.getItem('token'),
      },
    });

    setSocket(newSocket);

    // Fetch existing tickets
    fetchTickets();

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('ticketUpdated', (updatedTicket: Ticket) => {
      setTickets(prev =>
        prev.map(ticket =>
          ticket.id === updatedTicket.id ? updatedTicket : ticket
        )
      );

      if (selectedTicket?.id === updatedTicket.id) {
        setSelectedTicket(updatedTicket);
      }
    });

    socket.on('ticketResponse', ({ ticketId, response }) => {
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => ({
          ...prev!,
          responses: [...prev!.responses, response],
        }));
      }
    });

    return () => {
      socket.off('ticketUpdated');
      socket.off('ticketResponse');
    };
  }, [socket, selectedTicket]);

  const fetchTickets = async () => {
    try {
      const response = await fetch('/support/my-tickets', {
        headers: {
          'Authorization': \`Bearer \${localStorage.getItem('token')}\`,
        },
      });
      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const submitResponse = async () => {
    if (!selectedTicket || !newResponse.trim()) return;

    try {
      await fetch(\`/support/\${selectedTicket.id}/responses\`, {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${localStorage.getItem('token')}\`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ response: newResponse }),
      });

      setNewResponse('');
    } catch (error) {
      console.error('Error submitting response:', error);
    }
  };

  return (
    <div className="support-container">
      <div className="tickets-list">
        <h2>My Support Tickets</h2>
        {tickets.map(ticket => (
          <div
            key={ticket.id}
            className={\`ticket-item \${ticket.status.toLowerCase()}\`}
            onClick={() => setSelectedTicket(ticket)}
          >
            <div className="ticket-title">{ticket.title}</div>
            <div className="ticket-meta">
              <span className="ticket-type">{ticket.type}</span>
              <span className="ticket-priority">{ticket.priority}</span>
              <span className="ticket-status">{ticket.status}</span>
            </div>
          </div>
        ))}
      </div>

      {selectedTicket && (
        <div className="ticket-details">
          <h3>{selectedTicket.title}</h3>
          <div className="ticket-description">
            {selectedTicket.description}
          </div>

          <div className="ticket-responses">
            {selectedTicket.responses.map((response, index) => (
              <div
                key={index}
                className={\`response \${
                  response.isAdminResponse ? 'admin' : 'user'
                }\`}
              >
                <div className="response-message">{response.message}</div>
                <div className="response-time">
                  {new Date(response.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="response-form">
            <textarea
              value={newResponse}
              onChange={(e) => setNewResponse(e.target.value)}
              placeholder="Type your response..."
            />
            <button onClick={submitResponse}>Send Response</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportComponent;
\`\`\`

## Error Handling

Common support-related errors.

\`\`\`typescript
// Invalid ticket data
{
  "statusCode": 400,
  "message": "Invalid ticket data",
  "errors": [
    {
      "field": "type",
      "message": "Invalid ticket type"
    }
  ]
}

// Unauthorized access
{
  "statusCode": 403,
  "message": "Only admins can access all tickets",
  "error": "Forbidden"
}

// Ticket not found
{
  "statusCode": 404,
  "message": "Ticket not found",
  "error": "Not Found"
}
\`\`\` 