import { Activity, CloudSun, Compass, Wind } from "lucide-react";

export const demoCourses = [
  { slug:"monsoon-dynamics", icon:CloudSun, iconClass:"sky", type:"Foundations", title:"Monsoon Dynamics & Forecasting", instructor:"Dr. Meera Nair", teacherSlug:"meera-nair", initials:"MN", progress:72, lessons:11, time:"2h 40m left", duration:"8 hours", level:"Beginner", category:"Synoptic Meteorology", description:"Understand the circulation patterns, onset signals, active and break phases, and practical forecasting methods behind the Indian summer monsoon." },
  { slug:"numerical-weather-prediction", icon:Wind, iconClass:"mint", type:"Practical · Intermediate", title:"Numerical Weather Prediction", instructor:"Prof. Arjun Rao", teacherSlug:"arjun-rao", initials:"AR", progress:34, lessons:12, time:"6h 15m left", duration:"12 hours", level:"Intermediate", category:"Forecasting", description:"Build confidence reading model output, comparing ensembles, and verifying numerical forecasts against observations." },
  { slug:"cloud-physics", icon:CloudSun, iconClass:"sky", type:"Advanced · Research", title:"Cloud Physics & Precipitation", instructor:"Dr. Kavita Iyer", teacherSlug:"kavita-iyer", initials:"KI", progress:12, lessons:14, time:"8h 20m left", duration:"14 hours", level:"Advanced", category:"Atmospheric Physics", description:"Explore cloud microphysics, precipitation processes, and the observations used to understand storm development." },
  { slug:"climate-data", icon:Activity, iconClass:"mint", type:"Data · Intermediate", title:"Climate Data & Modelling", instructor:"Dr. S. Menon", teacherSlug:"s-menon", initials:"SM", progress:58, lessons:10, time:"3h 10m left", duration:"10 hours", level:"Intermediate", category:"Climate Science", description:"Work with climate data, anomaly maps, model outputs, and reproducible analysis workflows." },
  { slug:"radar-satellite", icon:Compass, iconClass:"sky", type:"Fieldwork · Foundations", title:"Radar & Satellite Meteorology", instructor:"Dr. Ananya Nair", teacherSlug:"ananya-nair", initials:"AN", progress:0, lessons:9, time:"5h 30m left", duration:"9 hours", level:"Beginner", category:"Remote Sensing", description:"Interpret radar and satellite imagery to track precipitation, cloud systems, and severe weather features." },
];

export const demoTeachers = [
  {slug:"meera-nair",name:"Dr. Meera Nair",initials:"MN",subject:"Monsoon Dynamics & Forecasting",specialty:"Synoptic Meteorology",experience:14,rating:4.9,learners:128,bio:"Senior forecaster and educator focused on monsoon systems, seasonal variability, and practical operational forecasting.",courseSlugs:["monsoon-dynamics"]},
  {slug:"arjun-rao",name:"Prof. Arjun Rao",initials:"AR",subject:"Numerical Weather Prediction",specialty:"NWP & Forecast Verification",experience:11,rating:4.8,learners:96,bio:"Researcher and instructor helping forecasters translate model guidance into clear, calibrated decisions.",courseSlugs:["numerical-weather-prediction"]},
  {slug:"kavita-iyer",name:"Dr. Kavita Iyer",initials:"KI",subject:"Cloud Physics & Precipitation",specialty:"Cloud Microphysics",experience:12,rating:4.9,learners:87,bio:"Atmospheric scientist teaching cloud processes, precipitation formation, and observational methods.",courseSlugs:["cloud-physics"]},
  {slug:"s-menon",name:"Dr. S. Menon",initials:"SM",subject:"Climate Data & Modelling",specialty:"Climate Data & Modelling",experience:9,rating:4.7,learners:74,bio:"Climate analyst and mentor specializing in model interpretation and practical data workflows.",courseSlugs:["climate-data"]},
  {slug:"ananya-nair",name:"Dr. Ananya Nair",initials:"AN",subject:"Radar & Satellite Meteorology",specialty:"Remote Sensing",experience:13,rating:5.0,learners:112,bio:"Operational meteorologist who teaches satellite and radar interpretation for real-world forecasting.",courseSlugs:["radar-satellite"]},
];

export const demoSkills = [
  {name:"Synoptic Meteorology",score:86,note:"Strong foundation"},
  {name:"Numerical Weather Prediction",score:72,note:"On track"},
  {name:"Climate Data & Modelling",score:61,note:"Focus area"},
  {name:"Radar Interpretation",score:48,note:"Building"},
  {name:"Upper-Air Analysis",score:54,note:"Building"},
  {name:"Tropical Cyclone Analysis",score:79,note:"On track"},
];
