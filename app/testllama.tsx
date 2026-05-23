// import { initLlama } from 'llama.rn';
// import { useEffect, useState } from 'react';
// import { Text, View, Button } from 'react-native';
//
// export default function TestLlama() {
//     const [output, setOutput] = useState('');
//     const [context, setContext] = useState(null);
//
//     useEffect(() => {
//         async function load() {
//             const ctx = await initLlama({
//                 model: require('../assets/models/gemma-3-1b-it-Q4_K_M.gguf'),
//                 use_mlock: true,
//                 n_ctx: 1024,
//                 n_threads: 4,
//             });
//             setContext(ctx);
//         }
//         load();
//     }, []);
//
//     async function runTest() {
//         if (!context) return;
//         const result = await context.completion({
//             prompt: '<start_of_turn>user\nSomeone is choking, what do I do?\n<end_of_turn>\n<start_of_turn>model\n',
//             n_predict: 200,
//             temperature: 0.7,
//             stop: ['<end_of_turn>'],
//         });
//         setOutput(result.text);
//     }
//
//     return (
//         <View>
//             <Button title="Test First Aid" onPress={runTest} />
//             <Text>{output || 'waiting...'}</Text>
//         </View>
//     );
// }