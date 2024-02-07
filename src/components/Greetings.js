export default function Greetings() 
{
    let timeOfDay;
    const date = new Date();
    const hours = date.getHours();
    const styles = {
      fontSize: 20,
    }
  
    if (hours < 12) {
      timeOfDay = 'morning';
      styles.color = "#D90000";
    } else if (hours >= 12 && hours < 17) {
      timeOfDay = 'afternoon';
      styles.color = "#04733F";
    } else {
      timeOfDay = 'Evening';
      styles.color = "#04756F";
    }
  
    return (
      <h1 style={styles}> Good {timeOfDay}!</h1>
    )
  }
