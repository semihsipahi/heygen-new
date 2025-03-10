import { Box, Step, StepLabel, Stepper } from '@mui/material';

function AIAssistantStepper({ activeStep, setActiveStep, steps }) {
  const handleStepClick = (index) => {
    setActiveStep(index);
  };

  return (
    <Box sx={{ width: '100%', textAlign: 'center', mt: 4 }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label, index) => (
          <Step key={index} style={{ cursor: 'pointer' }}>
            <StepLabel
              onClick={() => handleStepClick(index)}
              sx={{
                cursor: 'pointer',
                '& .MuiStepLabel-label': { transition: 'color 0.3s' },
                '& .MuiStepLabel-label.Mui-active': { color: 'primary.main' },
              }}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
export default AIAssistantStepper;
