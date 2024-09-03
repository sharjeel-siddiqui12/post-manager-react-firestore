import { useState, useEffect } from "react";
import axios from 'axios';
import moment from 'moment';
import { initializeApp } from "firebase/app";
import { firebaseConfig } from './firebaseConfig.js'; 

import { 
  getFirestore, collection,
  addDoc, getDocs, doc,
  onSnapshot, query, serverTimestamp,
  orderBy, deleteDoc, updateDoc
} from "firebase/firestore";

// Initialize Firebase
const app = initializeApp(firebaseConfig);  // firebase configuration => make sure to replace with your own (go to project settings in firebase and copy your configuration then make another file named firebaseConfig.js and export the configuration)
const db = getFirestore(app);

function Post() {
  const [postText, setPostText] = useState("");
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editing, setEditing] = useState({
    editingId: null,
    editingText: "",
  });

  useEffect(() => {
    let unsubscribe = null;

    const getRealtimeData = async () => {
      const q = query(collection(db, "posts"), orderBy("createdOn", "desc"));

      unsubscribe = onSnapshot(q, (querySnapshot) => {
        const posts = [];
        querySnapshot.forEach((doc) => {
          posts.push({ id: doc.id, ...doc.data() });
        });
        setPosts(posts);
        console.log("posts: ", posts);
      });
    };
    getRealtimeData();

    return () => {
      console.log("Cleanup function");
      unsubscribe();
    };
  }, []);

  const savePost = async (e) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, "posts"), {
        text: postText,
        createdOn: serverTimestamp(),
      });
      console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  const deletePost = async (postId) => {
    await deleteDoc(doc(db, "posts", postId));
  };

  const updatePost = async (e) => {
    e.preventDefault();
    await updateDoc(doc(db, "posts", editing.editingId), {
      text: editing.editingText,
    });
    setEditing({
      editingId: null,
      editingText: "",
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-100 rounded-lg shadow-lg mt-6 mb-9">
      <form
        onSubmit={savePost}
        className="mb-6 bg-white p-4 rounded-lg shadow-md"
      >
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="What's on your mind..."
          onChange={(e) => setPostText(e.target.value)}
        />
        <button
          type="submit"
          className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300"
        >
          Post
        </button>
      </form>

      <div>
        {isLoading ? (
          <div className="text-center text-gray-500 mb-4">Loading...</div>
        ) : null}
        {posts.map((eachPost, i) => (
          <div key={i} className="bg-white p-5 rounded-lg shadow-lg mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {eachPost.id === editing.editingId ? (
                <form onSubmit={updatePost} className="flex">
                  <input
                    type="text"
                    value={editing.editingText}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        editingText: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter updated text"
                  />
                  <button
                    type="submit"
                    className="ml-3 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition duration-300"
                  >
                    Update
                  </button>
                </form>
              ) : (
                eachPost?.text
              )}
            </h3>

            <span className="text-sm text-gray-400">
              {moment(
                eachPost?.createdOn?.seconds
                  ? eachPost.createdOn.seconds * 1000
                  : undefined
              ).format("Do MMMM, h:mm a")}
            </span>

            <div className="mt-5 flex space-x-3">
              <button
                onClick={() => deletePost(eachPost?.id)}
                className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition duration-300"
              >
                Delete
              </button>
              {editing.editingId !== eachPost?.id && (
                <button
                  onClick={() =>
                    setEditing({
                      editingId: eachPost?.id,
                      editingText: eachPost?.text,
                    })
                  }
                  className="bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition duration-300"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Post;
