#!/usr/bin/env python3
"""
Prophet-based forecasting service for energy consumption data
Generates synthetic data and provides 48-hour forecasts
"""

import sys
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from prophet import Prophet
import warnings

# Suppress Prophet warnings for cleaner output
warnings.filterwarnings("ignore")

def generate_synthetic_energy_data():
    """Generate realistic synthetic energy consumption data for the last 30 days"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    # Create hourly timestamps
    timestamps = pd.date_range(start=start_date, end=end_date, freq='H')
    
    # Generate realistic energy consumption pattern
    data = []
    for i, ts in enumerate(timestamps):
        # Base consumption with daily and weekly patterns
        hour = ts.hour
        day_of_week = ts.weekday()
        
        # Daily pattern: higher consumption during day, lower at night
        daily_pattern = 50 + 30 * np.sin((hour - 6) * np.pi / 12)
        
        # Weekly pattern: higher on weekdays
        weekly_pattern = 10 if day_of_week < 5 else -5
        
        # Seasonal trend (slight increase over time)
        trend = i * 0.01
        
        # Random noise
        noise = np.random.normal(0, 5)
        
        # Combine all components
        consumption = max(0, daily_pattern + weekly_pattern + trend + noise)
        
        data.append({
            'ds': ts,
            'y': consumption
        })
    
    return pd.DataFrame(data)

def run_prophet_forecast(data, forecast_hours=48):
    """Run Prophet forecast on the provided data"""
    try:
        # Initialize Prophet model
        model = Prophet(
            yearly_seasonality=False,
            weekly_seasonality=True,
            daily_seasonality=True,
            seasonality_mode='additive'
        )
        
        # Fit the model
        model.fit(data)
        
        # Create future dataframe for forecast
        future = model.make_future_dataframe(periods=forecast_hours, freq='H')
        
        # Generate forecast
        forecast = model.predict(future)
        
        # Extract relevant columns and convert to JSON-serializable format
        result = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(forecast_hours)
        
        forecast_data = []
        for _, row in result.iterrows():
            forecast_data.append({
                'timestamp': row['ds'].isoformat(),
                'predicted': float(row['yhat']),
                'lower': float(row['yhat_lower']),
                'upper': float(row['yhat_upper'])
            })
        
        # Also include historical data for comparison
        historical_data = []
        for _, row in data.tail(72).iterrows():  # Last 3 days
            historical_data.append({
                'timestamp': row['ds'].isoformat(),
                'actual': float(row['y'])
            })
        
        return {
            'success': True,
            'historical': historical_data,
            'forecast': forecast_data,
            'model_info': {
                'training_samples': len(data),
                'forecast_horizon_hours': forecast_hours,
                'generated_at': datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'generated_at': datetime.now().isoformat()
        }

def main():
    """Main function to handle command line arguments and run forecast"""
    try:
        # Check if live data parameter is provided
        use_live_data = len(sys.argv) > 1 and sys.argv[1] == '--live'
        
        if use_live_data:
            # TODO: Implement live data fetching from GEKKO API
            # For now, fall back to synthetic data
            pass
        
        # Generate synthetic data
        data = generate_synthetic_energy_data()
        
        # Run forecast
        start_time = datetime.now()
        result = run_prophet_forecast(data)
        end_time = datetime.now()
        
        # Add timing information
        if result['success']:
            result['model_info']['training_duration_ms'] = int((end_time - start_time).total_seconds() * 1000)
        
        # Output JSON result
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'generated_at': datetime.now().isoformat()
        }
        print(json.dumps(error_result, indent=2))

if __name__ == '__main__':
    main()