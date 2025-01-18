import { AnalysisType } from '@/app/actions/process-image'

export const ANALYSIS_PROMPTS: Record<AnalysisType, string> = {
  hydration: `Analyze facial indicators of hydration levels. Look for:
1. Skin appearance (dry, flaky, dull vs plump, glowing)
2. Under-eye appearance (dark circles, sunken)
3. Lip condition (dry, cracked vs moisturized)
4. Overall skin elasticity
5. Signs of dehydration (sunken cheeks, dull complexion)

Provide specific advice for improving hydration if needed.

Important: Avoid pareidolia. Do not hallucinate or make up information that is not clearly visible in the image. If any feature is unclear or not visible, state that it cannot be determined.
`,

  emotion: 'Analyze the facial expressions in this image with short sentences. What is the main emotion being expressed? What facial features indicate this emotion (eyes, mouth, eyebrows)? Are there any mixed or subtle emotions present? How confident are you about this analysis (high/medium/low)? If multiple faces are present, analyze each person. Important: Avoid pareidolia. Do not hallucinate or make up information that is not clearly visible in the image. If emotions cannot be determined clearly, state so.',

  fatigue: 'Analyze facial fatigue indicators in this image with short sentences. Rate the overall fatigue level on a scale of 1-10. For the eyes, assess droopiness/heaviness, presence of eye bags, and any visible redness or strain. Look for facial muscle strain and areas of tension. Note any signs of exhaustion or stress in their expression. Consider skin appearance (paleness/dullness) and posture (head position and alertness). Provide an overall assessment of fatigue indicators. If multiple people are present, analyze each person separately. Important: Avoid pareidolia. Do not hallucinate or make up information that is not clearly visible in the image. If fatigue levels cannot be determined clearly, state so.',

  gender: 'Analyze the apparent gender presentation in this image in point form with short sentences. What gender presentation is observed? What features inform this observation? How confident are you about this analysis (high/medium/low)? If multiple people are present, analyze each person. Important: Avoid pareidolia. Do not hallucinate or make up information that is not clearly visible in the image. If gender presentation cannot be determined clearly, state so.',

  description: 'Provide a detailed description of the person(s) in this image with short sentences. Include physical features like height, build, and hair color/style. Describe their clothing. If they wearing a nametag on his chest, please include it in the description. Note any distinctive characteristics. If multiple people are present, describe each person. Important: Avoid pareidolia. Do not hallucinate or make up information that is not clearly visible in the image. If any feature cannot be determined clearly, state so.',

  accessories: 'List all accessories and additional items visible in this image with short sentences. Include facial accessories like glasses and piercings, jewelry like necklaces, rings, and earrings, and any other notable accessories. If multiple people are present, list items for each person. Important: Avoid pareidolia. Do not hallucinate or make up information that is not clearly visible in the image. Only list items that are clearly visible.',

  general: 'Analyze the overall scene in this image with short sentences. Describe the setting, lighting, and any notable details. If multiple people are present, describe the group as a whole. Important: Avoid pareidolia. Do not hallucinate or make up information that is not clearly visible in the image. If any aspect cannot be determined clearly, state so.',

  gaze: `Analyze the gaze direction and attention in this image. For each face detected:
1. Describe the relative position in the frame (e.g., "left side", "center", "top right")
2. Identify where they are looking (e.g., "at camera", "at person on left", "at person on right" "downward", "upward")
3. Rate their attention level (1-10)
4. Note any eye contact between people
5. Their position in the frame
6. Where they are looking
7. Their attention level (1-10)
8. Any eye contact or gaze interactions with others

Important: Avoid pareidolia. Do not hallucinate or make up information that is not clearly visible in the image. If gaze direction or attention cannot be determined clearly, state so.

Summarize the overall gaze patterns and interactions between people.`,

  hair: 'Analyze the hair characteristics in detail and Describe: 1) Hair color, 2) Hair length (e.g., short, medium, long, with approximate measurements), 3) Hair texture (straight, wavy, curly, coily), 4) Hair style (how it is worn/styled), 5) Hair volume and thickness, 6) Any notable hair treatments or conditions visible. If multiple people are present, analyze each person\'s hair separately. Important: Avoid pareidolia. Do not hallucinate or make up information that is not clearly visible in the image. If any hair characteristic cannot be determined clearly, state so.',

  crowd: 'Analyze the crowd or group in this image with short sentences. Provide: 1) Group Size: Exact count or estimate of people visible, 2) Demographics: Age ranges, gender distribution, and any notable diversity patterns, 3) Engagement Level: Rate overall group engagement (1-10) and describe interaction patterns, 4) Spatial Distribution: How people are positioned/grouped, 5) Behavioral Patterns: Common activities, attention focus, or shared behaviors, 6) Majority Demographic: Identify the predominant audience type (e.g., families, professionals, students). Include confidence level for each observation. Important: Avoid pareidolia. Do not hallucinate or make up information that is not clearly visible in the image. If any aspect cannot be determined clearly, state so.',

  item_extraction: `Extract the following information from the image and format it as JSON:
  {
    "items": [
      {
        "name": "Name or description of the item",
        "quantity": "Number of items (if applicable)",
        "price": "Price in any format (if shown)",
        "details": "Any additional details about the item",
        "location": "Where the item appears in the image"
      }
    ]
  }
  
  Avoid pareidolia. Do not hallucinate or make up information that is not present in the image. If any information is unclear or not visible, return null for that field.`,

  text_detection: `Analyze and extract all text and numbers visible in the image, you only focus on text or numbers, Only return the text and numbers that are clearly visible in the image, if there is no text or numbers, return as NO TEXT OR NUMBERS FOUND.

Important: Avoid pareidolia. Do not hallucinate or make up information that is not clearly visible in the image. If any feature is unclear or not visible, state that it cannot be determined.
`
} 