export interface FirstAidStep {
    title: string;
    instruction: string;
}

export interface FirstAidGuide {
    id: string;
    title: string;
    category: string;
    description: string;
    steps: FirstAidStep[];
    emergencyContact?: string;
}

export const FIRST_AID_DATA: FirstAidGuide[] = [
    {
        id: '1',
        title: 'Severe Bleeding',
        category: 'Trauma',
        description: 'Immediate action required to stop heavy blood loss.',
        steps: [
            { title: 'Apply Pressure', instruction: 'Use a clean cloth or bandage and apply firm, direct pressure to the wound.' },
            { title: 'Elevate', instruction: 'If possible, raise the injured limb above the level of the heart.' },
            { title: 'Do Not Remove', instruction: 'If blood seeps through, add more bandages on top. Do not remove the original one.' },
            { title: 'Tourniquet', instruction: 'Only use a tourniquet if direct pressure fails to stop life-threatening bleeding on an arm or leg.' },
        ],
    },
    {
        id: '2',
        title: 'Snake Bite',
        category: 'Bites/Stings',
        description: 'Treatment for venomous and non-venomous snake bites.',
        steps: [
            { title: 'Stay Calm', instruction: 'Keep the victim calm and still to slow the spread of venom.' },
            { title: 'Position', instruction: 'Keep the bitten area below the level of the heart.' },
            { title: 'Remove Jewelry', instruction: 'Remove tight clothing or jewelry near the bite before swelling starts.' },
            { title: 'Clean', instruction: 'Clean the wound with soap and water but do not flush with water under pressure.' },
            { title: 'Do NOT', instruction: 'Do not use a tourniquet, do not cut the wound, and do not try to suck out the venom.' },
        ],
    },
    {
        id: '3',
        title: 'Bone Fracture',
        category: 'Trauma',
        description: 'Stabilizing broken bones in remote locations.',
        steps: [
            { title: 'Immobilize', instruction: 'Do not try to realign the bone. Use a splint to keep the joint above and below the fracture still.' },
            { title: 'Stop Bleeding', instruction: 'If it is an open fracture, stop the bleeding first without pushing the bone back.' },
            { title: 'Ice Pack', instruction: 'Apply ice or cold packs to reduce swelling (not directly on skin).' },
            { title: 'Monitor', instruction: 'Check for signs of shock or loss of circulation below the injury.' },
        ],
    },
    {
        id: '4',
        title: 'Hypothermia',
        category: 'Environmental',
        description: 'When the body loses heat faster than it can produce it.',
        steps: [
            { title: 'Move to Shelter', instruction: 'Get the person out of the cold and wind.' },
            { title: 'Dry Clothing', instruction: 'Remove wet clothes and replace with dry blankets or clothing.' },
            { title: 'Warm Drinks', instruction: 'Give warm, non-alcoholic, non-caffeinated liquids if they are conscious.' },
            { title: 'Gradual Warming', instruction: 'Focus on warming the core (chest, neck, groin) first. Avoid direct high heat.' },
        ],
    },
    {
        id: '5',
        title: 'Heat Stroke',
        category: 'Environmental',
        description: 'Severe overheating, a life-threatening condition.',
        steps: [
            { title: 'Cool Down', instruction: 'Move the person to shade or a cool environment immediately.' },
            { title: 'Rapid Cooling', instruction: 'Spray with cool water, use fans, or apply ice packs to the armpits, groin, and neck.' },
            { title: 'Hydration', instruction: 'If conscious, give sips of cool water.' },
            { title: 'Monitor', instruction: 'Heat stroke is a medical emergency. Watch for confusion or loss of consciousness.' },
        ],
    },
    {
        id: '6',
        title: 'Altitude Sickness',
        category: 'Environmental',
        description: 'Common when trekking at high elevations.',
        steps: [
            { title: 'Descend', instruction: 'The most effective treatment is to move to a lower altitude immediately.' },
            { title: 'Rest', instruction: 'Stop climbing and rest until symptoms improve.' },
            { title: 'Hydration', instruction: 'Drink plenty of water and avoid alcohol.' },
            { title: 'Oxygen', instruction: 'If available, administer supplemental oxygen.' },
        ],
    },
    {
        id: '7',
        title: 'Choking',
        category: 'Respiratory',
        description: 'When an object blocks the airway.',
        steps: [
            { title: 'Five-and-Five', instruction: 'Give 5 back blows followed by 5 abdominal thrusts (Heimlich maneuver).' },
            { title: 'Abdominal Thrusts', instruction: 'Stand behind the person, wrap arms around waist, and pull inward and upward with a fist.' },
            { title: 'Repeat', instruction: 'Continue until the object is forced out or the person loses consciousness.' },
            { title: 'CPR', instruction: 'If they become unconscious, start CPR immediately.' },
        ],
    },
    {
        id: '8',
        title: 'Burns',
        category: 'Trauma',
        description: 'Treatment for thermal, chemical, or electrical burns.',
        steps: [
            { title: 'Cool the Burn', instruction: 'Run cool (not cold) water over the area for at least 10-20 minutes.' },
            { title: 'Cover Loosely', instruction: 'Apply a sterile, non-stick bandage or clean cloth loosely.' },
            { title: 'Do NOT Pop', instruction: 'Do not pop blisters or apply ointments, butter, or ice directly.' },
            { title: 'Seek Help', instruction: 'For deep burns or burns on face/hands, seek immediate medical attention.' },
        ],
    },
    {
        id: '9',
        title: 'Heart Attack',
        category: 'Cardiovascular',
        description: 'Signs include chest pain, shortness of breath, and nausea.',
        steps: [
            { title: 'Call for Help', instruction: 'Immediately alert emergency services if you suspect a heart attack.' },
            { title: 'Rest', instruction: 'Have the person sit down, rest, and try to keep calm.' },
            { title: 'Aspirin', instruction: 'If not allergic, have them chew and swallow one adult-strength aspirin.' },
            { title: 'Monitor', instruction: 'Be ready to perform CPR if the person becomes unconscious.' },
        ],
    },
    {
        id: '10',
        title: 'Poisoning',
        category: 'Toxicological',
        description: 'Treatment for ingested harmful substances.',
        steps: [
            { title: 'Identify', instruction: 'Try to identify what and how much was swallowed and when.' },
            { title: 'Do NOT Induce', instruction: 'Do not induce vomiting unless told to do so by a professional.' },
            { title: 'Clear Mouth', instruction: 'If the person swallowed something, have them spit out any remaining substance.' },
            { title: 'Seek Help', instruction: 'Contact a poison control center or emergency services immediately.' },
        ],
    },
    {
        id: '11',
        title: 'Electric Shock',
        category: 'Trauma',
        description: 'Safety first: do not touch the victim if they are still in contact with the source.',
        steps: [
            { title: 'Cut Power', instruction: 'Turn off the source of electricity if possible. Do not touch the person until then.' },
            { title: 'Use Non-Conductor', instruction: 'If power cannot be cut, use a dry wooden stick to push the person away from the source.' },
            { title: 'Check ABCs', instruction: 'Check Airway, Breathing, and Circulation. Start CPR if necessary.' },
            { title: 'Treat Burns', instruction: 'Treat any visible burns as thermal burns but prioritize internal injuries.' },
        ],
    },
    {
        id: '12',
        title: 'Stroke (FAST)',
        category: 'Neurological',
        description: 'Rapid identification is critical for stroke victims.',
        steps: [
            { title: 'Face', instruction: 'Ask the person to smile. Does one side of the face droop?' },
            { title: 'Arms', instruction: 'Ask the person to raise both arms. Does one arm drift downward?' },
            { title: 'Speech', instruction: 'Ask the person to repeat a simple phrase. Is their speech slurred or strange?' },
            { title: 'Time', instruction: 'If you see any of these signs, call emergency services immediately.' },
        ],
    },
    {
        id: '13',
        title: 'Seizure',
        category: 'Neurological',
        description: 'Protecting the person from injury during a seizure.',
        steps: [
            { title: 'Safe Space', instruction: 'Clear the area of hard or sharp objects. Place something soft under their head.' },
            { title: 'Do NOT Restrain', instruction: 'Do not hold the person down or try to stop their movements.' },
            { title: 'Airway', instruction: 'Do not put anything in the person\'s mouth.' },
            { title: 'Recovery', instruction: 'Once the seizure ends, roll them onto their side to keep the airway clear.' },
        ],
    },
    {
        id: '14',
        title: 'Diabetic Emergency',
        category: 'Endocrine',
        description: 'Usually caused by low blood sugar (Hypoglycemia).',
        steps: [
            { title: 'Give Sugar', instruction: 'If they are conscious, give them sugar (juice, candy, glucose tabs).' },
            { title: 'Wait', instruction: 'Wait 15 minutes for improvement. If no improvement, give more sugar.' },
            { title: 'Unconscious', instruction: 'If they are unconscious, do not give anything by mouth. Call for help.' },
            { title: 'Monitor', instruction: 'Stay with them until they are fully alert or professional help arrives.' },
        ],
    },
];
