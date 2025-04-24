import React from "react";

const CreateCampaignForm = ({ newCampaign, handleInputChange, createCampaign, loading }) => {
  return (
    <form onSubmit={createCampaign} className="create-campaign-form">
      <div className="form-group">
        <label htmlFor="name">Campaign Name</label>
        <input
          type="text"
          id="name"
          name="name"
          placeholder="Give your campaign a name"
          value={newCampaign.name}
          onChange={handleInputChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          placeholder="Describe your campaign's purpose"
          value={newCampaign.description}
          onChange={handleInputChange}
          required
          rows={4}
        />
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="goal">Goal (ETH)</label>
          <input
            type="number"
            id="goal"
            name="goal"
            placeholder="Target amount in ETH"
            value={newCampaign.goal}
            onChange={handleInputChange}
            min="0.01"
            step="0.01"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="duration">Duration (days)</label>
          <input
            type="number"
            id="duration"
            name="duration"
            placeholder="Campaign duration in days"
            value={newCampaign.duration}
            onChange={handleInputChange}
            min="1"
            required
          />
        </div>
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? "Creating..." : "Create Campaign"}
      </button>
    </form>
  );
};

export default CreateCampaignForm;