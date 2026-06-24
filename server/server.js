const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// Mock Database for properties
let properties = [
  { id: 1, name: "Oakwood Apartments, Apt 4B", landlordEmail: "landlord1@example.com", tasks: [] },
  { id: 2, name: "Maple Street House, No. 12", landlordEmail: "landlord2@example.com", tasks: [] }
];

// Nodemailer Email Configurer (Using a mock/test account or your actual SMTP)
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email', // Replace with real SMTP like Gmail/SendGrid later
  port: 587,
  auth: {
    user: 'your-smtp-username', 
    pass: 'your-smtp-password'
  }
});

// 1. Get all properties
app.get('/api/properties', (req, res) => {
  res.json(properties);
});

// 2. Add a task to a property
app.post('/api/properties/:id/tasks', async (req, res) => {
  const propertyId = parseInt(req.params.id);
  const property = properties.find(p => p.id === propertyId);

  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  const newTask = {
    id: Date.now(),
    type: req.body.type, // e.g., "Key Collection"
    currentLocation: req.body.currentLocation,
    assignedEmployee: req.body.assignedEmployee,
    scheduledDateTime: req.body.scheduledDateTime,
    status: 'Pending'
  };

  property.tasks.push(newTask);
  res.status(201).json(property);
});

// 3. Complete a task & send email to Landlord
app.post('/api/properties/:propertyId/tasks/:taskId/collect', async (req, res) => {
  const propertyId = parseInt(req.params.propertyId);
  const taskId = parseInt(req.params.taskId);
  
  const property = properties.find(p => p.id === propertyId);
  if (!property) return res.status(404).json({ message: "Property not found" });

  const task = property.tasks.find(t => t.id === taskId);
  if (!task) return res.status(404).json({ message: "Task not found" });

  // Update Status
  task.status = 'Collected';

  // Trigger Email
  const mailOptions = {
    from: '"Property Manager" <noreply@propertymanager.com>',
    to: property.landlordEmail,
    subject: `🔑 Key Collected for ${property.name}`,
    text: `Hello,\n\nThis is an automated update confirming that the keys for ${property.name} have been successfully collected by our team member, ${task.assignedEmployee}.\n\nBest regards,\nProperty Management Team`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: "Task updated and email sent to landlord!", property });
  } catch (error) {
    console.error("Email failed:", error);
    res.json({ message: "Task updated, but email notification failed.", property });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));