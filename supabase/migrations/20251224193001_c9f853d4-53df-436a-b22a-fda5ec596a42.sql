-- Reset the stuck BCQ response analysis status
UPDATE public.business_case_responses 
SET content_analysis_status = 'pending'
WHERE id = 'ac69b355-6bba-483f-85c7-457a8329fa62' 
  AND content_analysis_status = 'analyzing';