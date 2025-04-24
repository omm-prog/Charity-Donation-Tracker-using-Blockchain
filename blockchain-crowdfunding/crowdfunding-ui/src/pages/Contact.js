import React, { useState, useEffect, useRef } from "react";
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaPaperPlane, FaHeart, FaHandHoldingHeart, FaDonate } from "react-icons/fa";
import "../styles/Contact.css";
// Import leaflet CSS and JS
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default icon issue
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const Contact = () => {
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    subject: "",
    message: "" 
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ success: false, message: "" });
  const [animateForm, setAnimateForm] = useState(false);
  const [activeCard, setActiveCard] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]);

  // Sample donation locations in Mumbai
  const donationLocations = [
    { id: 1, name: "Main Office", lat: 19.0760, lng: 72.8777, address: "123 Community Way, Dadar, Mumbai", hours: "Mon-Fri: 9am-5pm" },
    { id: 2, name: "Downtown Center", lat: 18.9387, lng: 72.8353, address: "456 Hope Street, Colaba, Mumbai", hours: "Mon-Sat: 10am-7pm" },
    { id: 3, name: "Westside Hub", lat: 19.0607, lng: 72.8362, address: "789 Charity Avenue, Bandra, Mumbai", hours: "24/7 Donation Box" },
    { id: 4, name: "Eastside Collection", lat: 19.0454, lng: 72.9211, address: "321 Give Street, Powai, Mumbai", hours: "Weekends: 10am-4pm" },
    { id: 5, name: "Community Center", lat: 19.1176, lng: 72.9060, address: "555 Volunteer Plaza, Mulund, Mumbai", hours: "Tue-Sun: 11am-6pm" }
  ];

  // Initialize map after component mounts
  useEffect(() => {
    setAnimateForm(true);
    
    // Only initialize map when the component is mounted and the container exists
    if (!mapRef.current && mapContainerRef.current) {
      // Initialize the map - centered on Mumbai
      mapRef.current = L.map(mapContainerRef.current).setView([19.0760, 72.8777], 11);
      
      // Add a tile layer (OSM)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
      
      // Add markers for each location
      donationLocations.forEach(location => {
        const marker = L.marker([location.lat, location.lng])
          .addTo(mapRef.current)
          .bindPopup(`<b>${location.name}</b><br>${location.address}<br>${location.hours}`);
        
        marker.on('click', () => {
          setSelectedLocation(location);
        });
        
        markersRef.current.push({ marker, locationId: location.id });
      });
      
      setMapLoaded(true);
    }
    
    return () => {
      // Clean up the map when component unmounts
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update marker styles when selected location changes
  useEffect(() => {
    if (selectedLocation && mapRef.current) {
      // Update marker styles based on selection
      markersRef.current.forEach(({ marker, locationId }) => {
        if (locationId === selectedLocation.id) {
          marker.setIcon(
            L.icon({
              iconUrl: icon,
              shadowUrl: iconShadow,
              iconSize: [35, 57], // Larger size for selected marker
              iconAnchor: [17, 57],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })
          );
          mapRef.current.setView([selectedLocation.lat, selectedLocation.lng], 14);
          marker.openPopup();
        } else {
          marker.setIcon(DefaultIcon);
        }
      });
    }
  }, [selectedLocation]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.message.trim()) newErrors.message = "Message is required";
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      // Shake the form on error
      setAnimateForm(false);
      setTimeout(() => setAnimateForm(true), 10);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitStatus({
        success: true,
        message: "Your message has been sent! We'll get back to you shortly."
      });
      
      // Reset form after successful submission
      setFormData({ name: "", email: "", subject: "", message: "" });
      
      // Celebrate animation
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 3000);
      
    } catch (error) {
      setSubmitStatus({
        success: false,
        message: "Failed to send message. Please try again later."
      });
    } finally {
      setIsSubmitting(false);
      
      // Clear status message after 5 seconds
      setTimeout(() => {
        setSubmitStatus({ success: false, message: "" });
      }, 5000);
    }
  };

  const handleLocationClick = (location) => {
    setSelectedLocation(location);
  };

  const [celebrate, setCelebrate] = useState(false);

  return (
    <div className={`contact-container ${animateForm ? 'fade-in' : ''}`}>
      <div className="contact-header">
        <h2 className="animated-title">Get In Touch <FaHeart className="heart-icon pulse" /></h2>
        <p className="subtitle-animated">Have questions about our platform or interested in collaboration? Reach out to our team.</p>
      </div>
      
      <div className="contact-main-content">
        {/* Left side - Map and donation locations */}
        <div className="map-container">
          <h3 className="map-title"><FaDonate /> Donation Locations</h3>
          
          <div className="map-wrapper">
            <div 
              ref={mapContainerRef} 
              className={`interactive-map ${mapLoaded ? 'loaded' : ''}`}
              style={{ height: "100%", width: "100%" }}
            />
          </div>
          
          <div className="donation-locations">
            <h4>Find a Donation Center Near You</h4>
            
            <div className="location-list">
              {donationLocations.map(location => (
                <div 
                  key={location.id}
                  className={`location-card ${selectedLocation?.id === location.id ? 'active' : ''}`}
                  onClick={() => handleLocationClick(location)}
                >
                  <div className="location-icon">
                    <FaHandHoldingHeart />
                  </div>
                  <div className="location-info">
                    <h5>{location.name}</h5>
                    <p>{location.address}</p>
                    <p className="hours">{location.hours}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right side - Contact info and form */}
        <div className="contact-right-side">
          <div className="contact-cards-container">
            <div 
              className={`contact-card ${activeCard === 'email' ? 'active' : ''}`}
              onMouseEnter={() => setActiveCard('email')}
              onMouseLeave={() => setActiveCard(null)}
              style={{ overflow: 'hidden' }} /* Added overflow hidden */
            >
              <div className="contact-icon bounce"><FaEnvelope /></div>
              <h3>Email Us</h3>
              <p style={{ fontSize: '0.9rem', wordBreak: 'break-word' }}>support@donationtrack.com</p>
              <p style={{ fontSize: '0.9rem', wordBreak: 'break-word' }}>partners@donationtrack.com</p>
            </div>
            
            <div 
              className={`contact-card ${activeCard === 'phone' ? 'active' : ''}`}
              onMouseEnter={() => setActiveCard('phone')}
              onMouseLeave={() => setActiveCard(null)}
            >
              <div className="contact-icon bounce"><FaPhone /></div>
              <h3>Call Us</h3>
              <p>+1 (555) 123-4567</p>
              <p>Mon-Fri, 9am-5pm IST</p>
            </div>
            
            <div 
              className={`contact-card ${activeCard === 'visit' ? 'active' : ''}`}
              onMouseEnter={() => setActiveCard('visit')}
              onMouseLeave={() => setActiveCard(null)}
            >
              <div className="contact-icon bounce"><FaMapMarkerAlt /></div>
              <h3>Visit Us</h3>
              <p>Vcet Innovation Hub</p>
              <p>Building 4, Mumbai University Campus</p>
            </div>
          </div>
          
          <div className={`contact-form-container ${animateForm ? 'slide-in' : 'shake'}`}>
            {selectedLocation && (
              <div className="selected-location-info">
                <h4>Selected Location: {selectedLocation.name}</h4>
                <p>{selectedLocation.address}</p>
                <p>{selectedLocation.hours}</p>
                <button 
                  className="close-btn"
                  onClick={() => setSelectedLocation(null)}
                >
                  Close
                </button>
              </div>
            )}
          
            <h3>Send a Message</h3>
            
            {submitStatus.message && (
              <div className={`status-message ${submitStatus.success ? 'success pulse' : 'error shake'}`}>
                {submitStatus.message}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Your Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? "error" : ""}
                    placeholder="John Doe"
                  />
                  {errors.name && <div className="error-message">{errors.name}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Your Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? "error" : ""}
                    placeholder="john@example.com"
                  />
                  {errors.email && <div className="error-message">{errors.email}</div>}
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="How can we help?"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="message">Your Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="5"
                  className={errors.message ? "error" : ""}
                  placeholder="Your message here..."
                />
                {errors.message && <div className="error-message">{errors.message}</div>}
              </div>
              
              <button 
                type="submit" 
                className={`submit-button ${isSubmitting ? 'loading' : ''} ${celebrate ? 'celebrate' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  "Sending..."
                ) : (
                  <>
                    <FaPaperPlane className="send-icon" /> Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {celebrate && (
        <div className="confetti-container">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="confetti" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              backgroundColor: `hsl(${Math.random() * 360}, 80%, 60%)`
            }}></div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Contact;