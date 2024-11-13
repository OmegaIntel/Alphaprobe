import React, { useState } from 'react';
import { API_BASE_URL, token } from "../../services";
import Fuse from 'fuse.js';

const FuzzySearch = ({section}) => {
  // Sample data for searching
  const items = [
    { industry_name : "Synthetic Fiber Manufacturing in the US" },
    { industry_name : "Syringes & Injection Needle Manufacturing in the US" },
    { industry_name : "Syrup & Flavoring Production in the US" },
    { industry_name : "Table Salt Production" },
    { industry_name : "Tackle Shops in the US" },
    { industry_name : "Tactical & Service Clothing Manufacturing in the US" },
    { industry_name : "Taekwondo Studios in the US" },
    { industry_name : "Tank & Armored Vehicle Manufacturing in the US" },
    { industry_name : "Tank & Refrigeration Trucking in the US" },
    { industry_name : "Tanning Salons in the US" },
    { industry_name : "Tattoo Artists in the US" },
    { industry_name : "Tax Lawyers and Attorneys in the US" },
    { industry_name : "Tax Preparation Services in the US" },
    { industry_name : "Tax Preparation Software Developers in the US" },
    { industry_name : "Taxi & Limousine Services in the US" },
    { industry_name : "Taxidermists in the US" },
    { industry_name : "Tea Production in the US" },
    { industry_name : "Telecommunication Networking Equipment Manufacturing in the US" },
    { industry_name : "Telecommunications Resellers in the US" },
    { industry_name : "Telehealth Services in the US" },
    { industry_name : "Telemarketing & Call Centers in the US" },
    { industry_name : "Telephone Wholesaling" },
    { industry_name : "Television Broadcasting in the US" },
    { industry_name : "Television Production in the US" },
    { industry_name : "Tent, Awning & Canvas Manufacturing in the US" },
    { industry_name : "Testing & Educational Support in the US" },
    { industry_name : "Textile Mills in the US" },
    { industry_name : "The Retail Market for Audio Equipment in the US" },
    { industry_name : "The Retail Market for Auto Tires" },
    { industry_name : "The Retail Market for Coffee in the US" },
    { industry_name : "The Retail Market for Headphones" },
    { industry_name : "The Retail Market for Home Furniture & Bedding" },
    { industry_name : "The Retail Market for Jewelry" },
    { industry_name : "The Retail Market for Laptop Computers" },
    { industry_name : "The Retail Market for Musical Instruments" },
    { industry_name : "The Retail Market for Outdoor Furniture" },
    { industry_name : "The Retail Market for Seasonal Decorations" },
    { industry_name : "The Retail Market for Shoes" },
    { industry_name : "The Retail Market for Smartphones" },
    { industry_name : "The Retail Market for Stationery Products" },
    { industry_name : "The Retail Market for Toys" },
    { industry_name : "Thermometer Manufacturing" },
    { industry_name : "Third-Party Administrators & Insurance Claims Adjusters in the US" },
    { industry_name : "Third-Party Logistics in the US" },
    { industry_name : "Thrift Stores in the US" },
    { industry_name : "Tile & Marble Stores in the US" },
    { industry_name : "Tile Installers in the US" },
    { industry_name : "Timber Services in the US" },
    { industry_name : "Tire & Rubber Recycling in the US" },
    { industry_name : "Tire Dealers in the US" },
    { industry_name : "Tire Manufacturing in the US" },
    { industry_name : "Tire Retreading & Recapping" },
    { industry_name : "Tire Wholesaling in the US" },
    { industry_name : "Title Insurance in the US" },
    { industry_name : "Tobacco Growing in the US" },
    { industry_name : "Tobacconists in the US" },
    { industry_name : "Tofu Production in the US" },
    { industry_name : "Toll Road Operation" },
    { industry_name : "Toll Roads & Weigh Stations in the US" },
    { industry_name : "Tool & Equipment Rental in the US" },
    { industry_name : "Tool & Hardware Wholesaling in the US" },
    { industry_name : "Tortilla Production in the US" },
    { industry_name : "Tour Operators in the US" },
    { industry_name : "Tourism in the US" },
    { industry_name : "Toxicology Laboratories in the US" },
    { industry_name : "Toy & Craft Supplies Wholesaling in the US" },
    { industry_name : "Toy, Doll & Game Manufacturing in the US" },
    { industry_name : "Tractors & Agricultural Machinery Manufacturing in the US" },
    { industry_name : "Trade & Technical Schools in the US" },
    { industry_name : "Trade Show and Conference Planning in the US" },
    { industry_name : "Trademark & Patent Lawyers & Attorneys" },
    { industry_name : "Trailer & Camper Manufacturing in the US" },
    { industry_name : "Trailer & RV Repair Services in the US" },
    { industry_name : "Train, Subway & Transit Car Manufacturing in the US" },
    { industry_name : "Trampoline Parks in the US" },
    { industry_name : "Transcription Services in the US" },
    { industry_name : "Translation Services in the US" },
    { industry_name : "Transmission Line Construction in the US" },
    { industry_name : "Transportation and Warehousing in the US" },
    { industry_name : "Travel Agencies in the US" },
    { industry_name : "Travel Insurance in the US" },
    { industry_name : "Treadmill Manufacturing" },
    { industry_name : "Tree & Shrub Farming in the US" },
    { industry_name : "Tree Trimming Services in the US" },
    { industry_name : "Trial Consultants" },
    { industry_name : "Truck & Bus Manufacturing in the US" },
    { industry_name : "Truck Dealers in the US" },
    { industry_name : "Truck Driving Schools in the US" },
    { industry_name : "Truck Rental in the US" },
    { industry_name : "Truck Repair in the US" },
    { industry_name : "Truck Trailer Dealers in the US" },
    { industry_name : "Truck Trailer Manufacturing in the US" },
    { industry_name : "Truck-Mounted Crane Manufacturing" },
    { industry_name : "Truck, Trailer & Motor Home Manufacturing in the US" },
    { industry_name : "Trusts & Estates in the US" },
    { industry_name : "Tugboat & Shipping Navigational Services in the US" },
    { industry_name : "Tunnel Construction in the US" },
    { industry_name : "Turbocharger Manufacturing in the US" },
    { industry_name : "Tutoring & Driving Schools in the US" },
    { industry_name : "Tutoring & Test Preparation Franchises" },
    { industry_name : "TV & Appliance Wholesaling in the US" },
    { industry_name : "Ultrasonic Cleaning Equipment Manufacturing" },
    { industry_name : "Unmanned Aerial Vehicle (UAV) Manufacturing in the US" },
    { industry_name : "Upholstery Cleaning & Repair Services in the US" },
    { industry_name : "Urban Planning Software in the US" },
    { industry_name : "Urethane Foam Manufacturing in the US" },
    { industry_name : "Urgent Care Centers in the US" },
    { industry_name : "Urologists in the US" },
    { industry_name : "Used Book Stores in the US" },
    { industry_name : "Used Car Dealers in the US" },
    { industry_name : "Used Car Parts Wholesaling in the US" },
    { industry_name : "Used Goods Stores in the US" },
    { industry_name : "Utilities in the US" },
    { industry_name : "Vacuum, Fan & Small Household Appliance Manufacturing in the US" },
    { industry_name : "Valet Services in the US" },
    { industry_name : "Valve Manufacturing in the US" },
    { industry_name : "Variable Message Signage Manufacturing" },
    { industry_name : "Vegetable Farming in the US" },
    { industry_name : "Vegetarian & Vegan Restaurants in the US" },
    { industry_name : "Vehicle Shipping Services in the US" },
    { industry_name : "Vending Machine Operators in the US" },
    { industry_name : "Venous Access Device Manufacturing in the US" },
    { industry_name : "Venture Capital & Principal Trading in the US" },
    { industry_name : "Veterinary Laboratory Testing Services in the US" },
    { industry_name : "Veterinary Services in the US" },
    { industry_name : "Video Conferencing Software Developers in the US" },
    { industry_name : "Video Game Software Publishing in the US" },
    { industry_name : "Video Games in the US" },
    { industry_name : "Video Games Software Developers in the US" },
    { industry_name : "Video Postproduction Services in the US" },
    { industry_name : "Video Streaming Services in the US" },
    { industry_name : "Video Surveillance Systems in the US" },
    { industry_name : "Videographers in the US" },
    { industry_name : "Virtual Data Rooms in the US" },
    { industry_name : "Virtual Private Network (VPN) Providers in the US" },
    { industry_name : "Virtual Reality Software in the US" },
    { industry_name : "Vision Insurance in the US" },
    { industry_name : "Visual Arts Schools in the US" },
    { industry_name : "Vitamin & Supplement Manufacturing in the US" },
    { industry_name : "Vodka Distilleries in the US" },
    { industry_name : "VoIP in the US" },
    { industry_name : "Walk-in & Cabinet Cooler Manufacturing" },
    { industry_name : "Warehouse Clubs & Supercenters in the US" },
    { industry_name : "Washer & Dryer Manufacturing" },
    { industry_name : "Waste Collection Services in the US" },
    { industry_name : "Waste Treatment & Disposal Services in the US" },
    { industry_name : "Waste-to-Energy Plant Operation in the US" },
    { industry_name : "Watch & Jewelry Repair in the US" },
    { industry_name : "Watch Manufacturing in the US" },
    { industry_name : "Water & Air Quality Testing Services in the US" },
    { industry_name : "Water & Sewer Line Construction in the US" },
    { industry_name : "Water Delivery Services in the US" },
    { industry_name : "Water Heater Manufacturing in the US" },
    { industry_name : "Water Parks in the US" },
    { industry_name : "Water Supply & Irrigation Systems in the US" },
    { industry_name : "Water Well Drilling Services in the US" },
    { industry_name : "Waterproofing Contractors in the US" },
    { industry_name : "Watersport Equipment Rental Services in the US" },
    { industry_name : "Wearable Device Manufacturing in the US" },
    { industry_name : "Weather Forecasting Services in the US" },
    { industry_name : "Web Design Services in the US" },
    { industry_name : "Web Domain Name Sales in the US" },
    { industry_name : "Website Creation Software Developers in the US" },
    { industry_name : "Wedding Planners in the US" },
    { industry_name : "Wedding Services in the US" },
    { industry_name : "Weight Loss Service Franchises" },
    { industry_name : "Weight Loss Services in the US" },
    { industry_name : "Weight Loss Surgery Centers" },
    { industry_name : "Welding Equipment Distributors in the US" },
    { industry_name : "Wheat, Barley & Sorghum Farming in the US" },
    { industry_name : "Wheelchair Manufacturing in the US" },
    { industry_name : "Whiskey & Bourbon Distilleries in the US" },
    { industry_name : "Wholesale Trade Agents and Brokers in the US" },
    { industry_name : "Wholesale Trade in the US" },
    { industry_name : "Wig & Hairpiece Manufacturing in the US" },
    { industry_name : "Wig & Hairpiece Stores in the US" },
    { industry_name : "Wind Farm Construction in the US" },
    { industry_name : "Wind Power in the US" },
    { industry_name : "Wind Turbine Installation in the US" },
    { industry_name : "Wind Turbine Manufacturing in the US" },
    { industry_name : "Window & Door Stores in the US" },
    { industry_name : "Window Blind Installation Franchises in the US" },
    { industry_name : "Window Coverings Wholesaling" },
    { industry_name : "Window Installation in the US" },
    { industry_name : "Window Tinting Services in the US" },
    { industry_name : "Window Treatment Stores in the US" },
    { industry_name : "Window Washing in the US" },
    { industry_name : "Wine & Spirits Wholesaling in the US" },
    { industry_name : "Wine Bars in the US" },
    { industry_name : "Wineries in the US" },
    { industry_name : "Wire & Cable Manufacturing in the US" },
    { industry_name : "Wire & Spring Manufacturing in the US" },
    { industry_name : "Wire Connector Manufacturing in the US" },
    { industry_name : "Wired Telecommunications Carriers in the US" },
    { industry_name : "Wireless Internet Service Providers in the US" },
    { industry_name : "Wireless Telecommunications Carriers in the US" },
    { industry_name : "Wireless Tower Construction in the US" },
    { industry_name : "Wiring Device Manufacturing in the US" },
    { industry_name : "Women's & Children's Apparel Wholesaling in the US" },
    { industry_name : "Women's Clothing Stores in the US" },
    { industry_name : "Women's, Girls' and Infants' Apparel Manufacturing in the US" },
    { industry_name : "Wood Door & Window Manufacturing in the US" },
    { industry_name : "Wood Flooring Manufacturing in the US" },
    { industry_name : "Wood Framing in the US" },
    { industry_name : "Wood Pallets & Skids Production in the US" },
    { industry_name : "Wood Paneling Manufacturing in the US" },
    { industry_name : "Wood Product Manufacturing in the US" },
    { industry_name : "Wood Pulp Mills in the US" },
    { industry_name : "Woodworking Machinery Manufacturing in the US" },
    { industry_name : "Workers' Compensation & Other Insurance Funds in the US" },
    { industry_name : "Workers' Compensation Insurance in the US" },
    { industry_name : "Wound Care Product Manufacturing in the US" },
    { industry_name : "X-Ray Machine Manufacturing in the US" },
    { industry_name : "Yeast & Bacteria for Food Production in the US" },
    { industry_name : "Yogurt Production in the US" },
    { industry_name : "Zipline Operators in the US" },
    { industry_name : "Zoos & Aquariums in the US" }
  ];

  // Fuse.js setup
  const options = {
    keys: ['industry_name'],
    threshold: 0.5,  // Controls fuzziness; lower is stricter
  };

  const fuse = new Fuse(items, options);

  // State for search input and suggestions
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [companyName, setCompanyName] = useState("");

  // Search button onclick handling
  const handleSearch = async (e) => {
    e.preventDefault();

    // Prepare the payload
    const payload = {
      data: {
        company_name: companyName,
      },
    };

    try {
      // Send the request to the API
      console.log(companyName)
      const response = await fetch(`${API_BASE_URL}/api/company-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log("Search payload".payload);
      console.log("Response:", result);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Handle input change and update suggestions
  const handleInputChange = (e) => {
    const value = e.target.value;
    setCompanyName(e.target.value)
    setQuery(value);

    if (value) {
      const results = fuse.search(value).map(result => result.item.industry_name);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  };

  // Handle suggestion selection
  const selectSuggestion = (item) => {
    setQuery(item);
    setSuggestions([]);
  };

  return (
    <div style={{ position: 'relative', margin: '0 auto', marginRight: 'none'}}>
      <form onSubmit={handleSearch}>
        <div style={{display: 'inline-flex'}}>
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder={section}
            style={{
              padding: "0.5rem",
              backgroundColor: "#fcfcfc",
              text: "#7a7a7a",
              borderRadius: "0.75rem",
              width: "16rem",
              height: "2.5rem",
              backgroundColor: '#0d0d0d',
            }}
          />
          <button type="submit" className="ml-2 p-2 bg-[#fcfcfc] text-[#121212] rounded-xl w-32 h-10 hover:bg-[#121212] hover:text-[#fcfcfc] transition-all duration-200 ease-out">
              Search
          </button>
        </div>
      </form>
      {suggestions.length > 0 && (
        <div style={{
          border: '1px solid black',
          maxHeight: '12rem',
          overflowY: 'auto',
          position: 'absolute',
          backgroundColor: 'white',
          width: '100%',
          zIndex: 1,
          color: 'black',
          borderRadius: "0.75rem",
        }}>
          {suggestions.map((item, index) => (
            <div
              key={index}
              onClick={() => selectSuggestion(item)}
              style={{ padding: '8px', cursor: 'pointer', borderRadius: "0.75rem" }}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FuzzySearch;
