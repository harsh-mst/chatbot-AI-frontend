import React from "react";
import "./Sidebar.css";
const DOCTORS = [
  {initials:"PS",name:"Dr. Priya Sharma",spec:"Cardiology",days:"Mon·Wed·Fri"},
  {initials:"AM",name:"Dr. Anjali Mehta",spec:"Pediatrics",days:"Mon–Fri"},
  {initials:"RK",name:"Dr. Rajesh Kumar",spec:"Orthopedics",days:"Tue·Thu·Sat"},
  {initials:"VP",name:"Dr. Vikram Patel",spec:"Neurology",days:"Wed·Fri"},
];
const TAGS = ["Heart Health","Child Care","Bone & Joint","Brain","Skin","Diabetes","Nutrition","Mental Health","Preventive","Women's Health"];
export default function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Sidebar">
      <div className="sidebar-card">
        <h3>Stay informed</h3>
        <p>Get weekly health insights from our doctors, straight to your inbox.</p>
        <div className="input-row">
          <input type="email" placeholder="your@email.com" aria-label="Email address"/>
          <button type="button">Join</button>
        </div>
      </div>
      <div className="sidebar-card">
        <h3>Our Doctors</h3>
        <div className="doctor-list">
          {DOCTORS.map(d => (
            <div key={d.name} className="doctor-item">
              <div className="doctor-avatar">{d.initials}</div>
              <div className="doctor-info">
                <div className="doctor-name">{d.name}</div>
                <div className="doctor-spec">{d.spec}</div>
              </div>
              <span className="doctor-avail">{d.days}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="sidebar-card">
        <h3>Browse topics</h3>
        <div className="tags-cloud">
          {TAGS.map(tag => <button key={tag} className="tag">{tag}</button>)}
        </div>
      </div>
    </aside>
  );
}
