// REAL DATA, cleaned from TradeStat (Ministry of Commerce), RBI Invisibles and World Bank WDI. Values in US$ billion.
// Columns: year,usd_inr,sector,imports,exports
const SECTOR_NAMES = {
 "oil": "Mineral Fuels & Oil (HS 27)",
 "agri": "Agriculture & Food (HS 01-24)",
 "chem": "Chemicals (ex pharma, fertiliser)",
 "pharma": "Pharmaceuticals",
 "fert": "Fertilisers",
 "plast": "Plastics & Rubber",
 "text": "Textiles & Apparel",
 "gems": "Gems & Jewellery",
 "steel": "Iron, Steel & Base Metals",
 "mach": "Machinery & Mechanical Appliances",
 "elec": "Electrical & Electronic Equipment (HS 85)",
 "auto": "Automobiles & Parts (HS 87)",
 "leather": "Leather, Footwear",
 "paper": "Wood, Paper & Printing",
 "ceramic": "Stone, Ceramics & Glass",
 "instr": "Optical & Medical Instruments",
 "other": "Other Goods (ores, aircraft, ships, misc.)",
 "travel": "Travel Services",
 "transport": "Transportation Services",
 "insur": "Insurance Services",
 "misc": "Software, Business & Other Services"
};
const DATA_NOTES = "Goods: Ministry of Commerce TradeStat (HS 2-digit chapters grouped into sectors; mineral fuels includes coal and gas), fiscal years labelled by end year (2025 = FY2024-25). Services: RBI Invisibles (receipts = exports, payments = imports); Miscellaneous includes software, business, financial and communication services. USD-INR: World Bank WDI calendar-year averages converted to fiscal-year averages as 0.75 x CY(start) + 0.25 x CY(end), an approximation. FY2023-24 export chapter values in the source were about double the reported total, so they were scaled by total/sum. FY2025-26 is excluded (no 2026 exchange rate yet). All values US$ billion.";
const REAL_CSV = `year,usd_inr,sector,imports,exports
2018,65.94,oil,132.295,38.469
2018,65.94,agri,23.251,36.720
2018,65.94,chem,35.092,26.177
2018,65.94,pharma,1.898,13.256
2018,65.94,fert,4.671,0.106
2018,65.94,plast,17.395,9.311
2018,65.94,text,7.036,36.748
2018,65.94,gems,74.710,41.743
2018,65.94,steel,26.585,27.698
2018,65.94,mach,37.824,17.868
2018,65.94,elec,48.269,9.325
2018,65.94,auto,5.845,17.255
2018,65.94,leather,1.750,6.139
2018,65.94,paper,7.842,2.131
2018,65.94,ceramic,2.679,3.405
2018,65.94,instr,9.104,3.094
2018,65.94,other,29.334,14.081
2018,65.94,travel,19.516,28.355
2018,65.94,transport,17.608,17.441
2018,65.94,insur,1.700,2.506
2018,65.94,misc,77.909,146.122
2019,68.90,oil,167.872,47.920
2019,68.90,agri,19.503,36.595
2019,68.90,chem,41.009,31.253
2019,68.90,pharma,2.083,14.754
2019,68.90,fert,6.662,0.148
2019,68.90,plast,18.960,11.222
2019,68.90,text,7.393,37.498
2019,68.90,gems,64.720,40.449
2019,68.90,steel,31.454,24.877
2019,68.90,mach,43.840,20.966
2019,68.90,elec,52.049,12.728
2019,68.90,auto,6.159,18.096
2019,68.90,leather,1.834,6.203
2019,68.90,paper,8.300,2.929
2019,68.90,ceramic,2.959,4.120
2019,68.90,instr,10.070,3.377
2019,68.90,other,29.211,16.943
2019,68.90,travel,21.704,28.441
2019,68.90,transport,20.529,19.464
2019,68.90,insur,1.790,2.661
2019,68.90,misc,80.922,156.824
2020,71.34,oil,153.646,42.709
2020,71.34,agri,19.859,33.888
2020,71.34,chem,36.594,30.914
2020,71.34,pharma,2.335,16.289
2020,71.34,fert,6.705,0.117
2020,71.34,plast,17.333,10.079
2020,71.34,text,8.157,34.222
2020,71.34,gems,54.494,36.086
2020,71.34,steel,27.668,23.352
2020,71.34,mach,43.368,20.835
2020,71.34,elec,49.188,15.188
2020,71.34,auto,5.244,16.712
2020,71.34,leather,1.761,5.595
2020,71.34,paper,7.421,2.797
2020,71.34,ceramic,2.699,4.440
2020,71.34,instr,9.653,3.488
2020,71.34,other,28.585,16.649
2020,71.34,travel,22.011,29.998
2020,71.34,transport,24.285,20.988
2020,71.34,insur,1.738,2.431
2020,71.34,misc,79.128,159.115
2021,74.05,oil,99.703,26.908
2021,74.05,agri,21.218,39.759
2021,74.05,chem,36.891,30.805
2021,74.05,pharma,2.553,19.384
2021,74.05,fert,6.873,0.105
2021,74.05,plast,16.219,10.125
2021,74.05,text,5.863,30.904
2021,74.05,gems,55.199,26.164
2021,74.05,steel,23.096,27.078
2021,74.05,mach,37.032,18.954
2021,74.05,elec,46.692,14.214
2021,74.05,auto,4.619,13.640
2021,74.05,leather,0.924,4.100
2021,74.05,paper,5.571,2.723
2021,74.05,ceramic,2.249,4.819
2021,74.05,instr,8.856,3.373
2021,74.05,other,20.879,18.753
2021,74.05,travel,11.507,8.483
2021,74.05,transport,19.755,21.854
2021,74.05,insur,2.058,2.376
2021,74.05,misc,83.182,172.746
2022,75.09,oil,194.857,69.570
2022,75.09,agri,31.485,47.474
2022,75.09,chem,52.591,39.296
2022,75.09,pharma,3.441,19.396
2022,75.09,fert,12.766,0.084
2022,75.09,plast,24.131,13.688
2022,75.09,text,8.337,43.438
2022,75.09,gems,81.664,39.269
2022,75.09,steel,33.929,46.453
2022,75.09,mach,50.587,25.410
2022,75.09,elec,62.490,20.179
2022,75.09,auto,6.345,19.762
2022,75.09,leather,1.419,5.530
2022,75.09,paper,8.056,4.368
2022,75.09,ceramic,3.060,5.633
2022,75.09,instr,11.780,4.107
2022,75.09,other,26.115,18.348
2022,75.09,travel,16.272,9.099
2022,75.09,transport,35.836,32.660
2022,75.09,insur,2.076,3.316
2022,75.09,misc,91.859,208.649
2023,79.60,oil,260.921,101.242
2023,79.60,agri,33.792,52.671
2023,79.60,chem,56.403,39.841
2023,79.60,pharma,2.617,19.862
2023,79.60,fert,15.322,0.131
2023,79.60,plast,27.297,12.360
2023,79.60,text,10.634,35.669
2023,79.60,gems,73.930,38.112
2023,79.60,steel,41.233,35.877
2023,79.60,mach,54.377,27.477
2023,79.60,elec,67.637,28.609
2023,79.60,auto,7.198,21.220
2023,79.60,leather,1.892,6.027
2023,79.60,paper,9.961,4.054
2023,79.60,ceramic,3.717,5.776
2023,79.60,instr,12.209,4.917
2023,79.60,other,36.830,17.225
2023,79.60,travel,28.447,27.049
2023,79.60,transport,40.617,36.091
2023,79.60,insur,2.347,3.277
2023,79.60,misc,109.620,258.229
2024,82.87,oil,219.051,87.602
2024,82.87,agri,31.971,48.299
2024,82.87,chem,51.338,38.665
2024,82.87,pharma,2.585,22.106
2024,82.87,fert,8.924,0.130
2024,82.87,plast,25.744,11.957
2024,82.87,text,8.891,34.837
2024,82.87,gems,74.492,32.853
2024,82.87,steel,44.071,33.555
2024,82.87,mach,57.393,30.057
2024,82.87,elec,79.291,34.413
2024,82.87,auto,7.610,20.889
2024,82.87,leather,1.639,5.398
2024,82.87,paper,8.753,3.760
2024,82.87,ceramic,3.760,6.227
2024,82.87,instr,13.563,5.128
2024,82.87,other,34.916,21.197
2024,82.87,travel,33.701,33.704
2024,82.87,transport,29.256,29.183
2024,82.87,insur,2.917,3.326
2024,82.87,misc,111.349,274.239
2025,84.54,oil,218.456,67.046
2025,84.54,agri,36.955,51.867
2025,84.54,chem,52.972,39.295
2025,84.54,pharma,2.981,24.578
2025,84.54,fert,8.285,0.162
2025,84.54,plast,26.749,13.021
2025,84.54,text,9.772,36.961
2025,84.54,gems,88.976,29.958
2025,84.54,steel,46.204,30.381
2025,84.54,mach,64.302,33.475
2025,84.54,elec,88.596,44.050
2025,84.54,auto,8.259,22.648
2025,84.54,leather,1.618,5.581
2025,84.54,paper,9.401,3.734
2025,84.54,ceramic,4.234,6.080
2025,84.54,instr,14.573,5.404
2025,84.54,other,38.866,23.462
2025,84.54,travel,34.843,34.152
2025,84.54,transport,35.029,33.759
2025,84.54,insur,3.035,3.565
2025,84.54,misc,124.548,315.437`;
