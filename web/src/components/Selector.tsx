import React, { useState, useEffect } from 'react';

const Selector = () => {
    const [countries, setCountries] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    useEffect(() => {
        console.log(countries)
    }, [countries])

    useEffect(() => {
        // Load countries from JSON file

    }, []);

    const handleCountryChange = (event) => {
        setSelectedCountry(event.target.value);
    };

    return (
        <div className="country-selector">
            <select
                value={selectedCountry}
                onChange={handleCountryChange}
                className="p-2 border rounded"
            >
                <option value="">Select a country</option>
                {countries.map(country => (
                    <option>
                        {country.name}
                    </option>
                ))}
            </select>
            {selectedCountry && (
                <p className="mt-2">You selected: {selectedCountry}</p>
            )}
        </div>
    );
};

export default Selector;
