# NYC311 data analysis + viz


I built a scroll-driven data story (inspired by <i>The Pudding</i> and *NYT Upshot-style* visual essays) that investigates how long New Yorkers wait for 311 complaints to be resolved, and how that varies by ZIP code and type of service request. The story mixes data analysis, cartography, and frontend storytelling to uncover patterns of inequality and inefficiency in city service delivery.

This project involved Python/Jupyter, pandas, GeoJSON, D3.js, Datawrapper, HTML/CSS/JavaScript.

The finalized project can be seen here[^1]: https://quinnmadethis.com/the-411-on-311

[^1]:As of Oct 30, the article has not been optimized for mobile viewing, so reading on a larger screen is recommended.

## Methodology

I downloaded data from October 2020 to October 2025[^2] from the [311 Service Requests from 2010 to Present](https://data.cityofnewyork.us/Social-Services/311-Service-Requests-from-2010-to-Present/erm2-nwe9/about_data) dataset, loaded it into an `.ipynb`, and cleaned the data to exclude null entries, typos in location (such as zip codes located in Michigan), and repeats. Any subsequent analysis, on average wait times or frequencies or others, were done on this cleaned dataframe.

[^2]:While the OpenData dataset goes as far back as to 2010, due to local hardware constraints, I chose to use a smaller subset that would still be relevant to the everyday New Yorker.

## Visualizing

Once I had my modified dataframes with desired stats, I used a [Modified Zip Code Tabulation Areas (MODZCTA)](https://catalog.data.gov/dataset/modified-zip-code-tabulation-areas-modzcta) shapefile to link datapoints and location boundaries into a GeoJSON file then I was then able to load into a D3.js map visualization with interactive tooltips. 

Non-map charts were made through Datawrapper and linked through `iframe`. Other visuals were added through HTML and CSS.
