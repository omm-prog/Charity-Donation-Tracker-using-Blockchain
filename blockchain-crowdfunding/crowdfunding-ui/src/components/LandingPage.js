import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import '../styles/LandingPage.css';

// Feature data
const features = [
  {
    icon: '🔗',
    title: 'Immutable Records',
    description: 'Every transaction permanently recorded on-chain'
  },
  {
    icon: '👁️',
    title: 'Full Transparency',
    description: 'Track funds from donor to beneficiary'
  },
  {
    icon: '⚡',
    title: 'Instant Settlement',
    description: 'No banking delays with crypto payments'
  },
  {
    icon: '🌐',
    title: 'Global Reach',
    description: 'Support causes anywhere in the world'
  }
];

// Steps data
const steps = [
  'NGO submits verified campaign',
  'Donors contribute crypto',
  'Smart contract holds funds',
  'Funds released when goals met'
];

const FeatureCard = ({ icon, title, description, index }) => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  return (
    <motion.div
      ref={ref}
      className="feature-card"
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -5 }}
    >
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </motion.div>
  );
};

const StepItem = ({ children, index }) => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  return (
    <motion.div
      ref={ref}
      className="step"
      initial={{ opacity: 0, x: -20 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ delay: index * 0.15, duration: 0.5 }}
    >
      <div className="step-number">{index + 1}</div>
      <div className="step-content">
        <h3>{children}</h3>
      </div>
    </motion.div>
  );
};

function LandingPage() {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Revolutionize Giving with <span className="text-gradient">Blockchain</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="fade-in"
            >
              Where every donation tells a transparent story
            </motion.p>
            
            <motion.div
              className="hero-cta"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <Link to="/donate" className="btn btn-primary">
                Explore Campaigns
                <span className="btn-icon">→</span>
              </Link>
              <Link to="/ngo-dashboard" className="btn btn-secondary">
                NGO Dashboard
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Why We're <span className="text-gradient">Different</span></h2>
            <p>Transparent, secure, and efficient giving powered by blockchain technology</p>
          </div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="section workflow">
        <div className="container">
          <div className="section-header">
            <h2>How It <span className="text-gradient">Works</span></h2>
            <p>A simple four-step process to revolutionize charitable giving</p>
          </div>
          
          <div className="steps">
            {steps.map((step, index) => (
              <StepItem key={index} index={index}>
                {step}
              </StepItem>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section">
        <div className="container">
          <motion.div
            className="cta-card"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-center">Ready to Make an Impact?</h2>
            <p className="text-center">Join thousands creating transparent change</p>
            <div className="cta-buttons">
              <Link to="/donate" className="btn btn-primary">
                Donate Now
              </Link>
              <Link to="/auth" className="btn btn-secondary">
                Register NGO
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;