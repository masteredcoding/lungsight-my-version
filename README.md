# lungsight hackathon winner
Simple end-to-end demo of an AI medical-imaging workflow using a React (Vite) frontend and a mock Express backend that mimics HOPPR’s API responses.

Video showcase: https://devpost.com/software/lungsight

Features Upload or select from the 4 sample X-ray images provided in sample DICOM data: https://drive.google.com/file/d/1XGdT2I6-KdCYFdnDK-ZWP7VLyIA27vn3/view Chose from these 4 to upload:

HackathonSampleDICOMImages/Calcification/train/07d82e7e5749cbc21633134f489a7fbf.dcm
HackathonSampleDICOMImages/Calcification/train/17dc4a83558d835efd5f7d6f110f07f3.dcm
HackathonSampleDICOMImages/Calcification/train/c341b3f8a0353bab2ec49147b97ce9d0.dcm
HackathonSampleDICOMImages/Consolidation/train/de7c0acddd7ed5fb90f5f5e12458235b.dcm
Mock AI x-ray analysis that is returned in HOPPR-like JSON Optional UI bits: findings list, urgency type, heatmap overlay

User will upload a dicom or any supported file then that file will be sent to the backend for processing.

An API call will be made to analyze the image which will then allow us to utilize the data given from the api call and make changes to the image or relay details back to front end.

Using the API call information given we can parse it and highlight sections of image and recommend doctors that align with the issues noticed on the image that the api returned.

After the image is processed users can then see the xray results, recommended doctors, compare another image, and finally download it as a pdf so they can print for further analysis.
